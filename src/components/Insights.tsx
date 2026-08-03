import { useEffect, useMemo, useState } from "react";
import { Box, Text, Heading, Badge, type BoxProps } from "@twilio-paste/core";
import { Theme } from "@twilio-paste/theme";
import { gql, useDataClientSubscription, TypedDocumentNode } from "@twilio/flex-sdk/data-client";
import type { Client } from "@twilio/flex-sdk";
import { useQueues } from "../hooks/useQueues";
import { MetricTile } from "./MetricTile";
import { Card } from "./ui/Card";

export const HIGHLIGHTED_METRICS_QUERY: TypedDocumentNode<HighlightedMetricsData, HighlightedMetricsVariables> = gql`
    subscription highlightedMetrics($input: HighlightedMetricsInput) {
        highlightedMetrics(input: $input) {
            accountSid
            instanceSid
            healthStatus
            metricType
            queueSid
            queueLevelMetrics {
                longestTaskWaitingFrom {
                    metricValue
                    alertLevel
                    thresholdValue
                }
                activeTasks {
                    metricValue
                    alertLevel
                }
                waitingTasks {
                    metricValue
                    alertLevel
                }
                averageWaitingTime {
                    metricValue
                    alertLevel
                }
                averageHandleTime {
                    metricValue
                    alertLevel
                }
                slaPercentage {
                    metricValue
                    alertLevel
                }
            }
            stableMetrics {
                ... on NowMetrics {
                    reservedTasks
                    totalTasks
                    pendingTasks
                    wrappingTasks
                    assignedTasks
                }
                ... on SlaMetrics {
                    slaPercentage
                    totalTasksCount
                    handledTasksCount
                    averageWaitingTime
                }
                ... on AgentMetrics {
                    availableAgents
                    unavailableAgents
                    offlineAgents
                }
            }
            channelStatsAlerts {
                channelSid
                healthStatus
            }
        }
    }
`;

interface MetricEntry {
    metricValue?: number | string;
    alertLevel?: string;
    thresholdValue?: number | string;
}

export interface HighlightedMetricsSubscriptionPayload {
    queueSid?: string;
    healthStatus?: string;
    metricType?: string;
    queueLevelMetrics?: {
        longestTaskWaitingFrom?: MetricEntry;
        activeTasks?: MetricEntry;
        waitingTasks?: MetricEntry;
        averageWaitingTime?: MetricEntry;
        averageHandleTime?: MetricEntry;
        slaPercentage?: MetricEntry;
    };
    stableMetrics?: {
        availableAgents?: number;
        unavailableAgents?: number;
        offlineAgents?: number;
        assignedTasks?: number;
        wrappingTasks?: number;
        pendingTasks?: number;
        reservedTasks?: number;
        slaPercentage?: number;
        averageWaitingTime?: number;
    };
    channelStatsAlerts?: Array<{ channelSid?: string; healthStatus?: string }>;
}

interface HighlightedMetricsData {
    highlightedMetrics: HighlightedMetricsSubscriptionPayload;
}

interface HighlightedMetricsVariables {
    input?: {
        queues: string[];
    };
}

export interface InsightsProps {
    sdkClient: Client;
}

interface InsightsSummary {
    availableAgents: number;
    unavailableAgents: number;
    offlineAgents: number;
    totalAgents: number;
    activeTasks: number;
    waitingTasks: number;
    avgWaitSeconds: number | null;
    slaPercentage: number | null;
    activeTasksAlert: boolean;
    waitingTasksAlert: boolean;
    avgWaitAlert: boolean;
    slaAlert: boolean;
}

const mergePayload = (
    previous: HighlightedMetricsSubscriptionPayload | undefined,
    incoming: HighlightedMetricsSubscriptionPayload
): HighlightedMetricsSubscriptionPayload => {
    const previousChannelAlertsBySid = new Map<string, { channelSid?: string; healthStatus?: string }>();

    (previous?.channelStatsAlerts ?? []).forEach((item) => {
        if (item.channelSid) {
            previousChannelAlertsBySid.set(item.channelSid, item);
        }
    });

    const mergedChannelAlertsBySid = new Map(previousChannelAlertsBySid);
    (incoming.channelStatsAlerts ?? []).forEach((item) => {
        if (item.channelSid) {
            mergedChannelAlertsBySid.set(item.channelSid, {
                ...(mergedChannelAlertsBySid.get(item.channelSid) ?? {}),
                ...item
            });
        }
    });

    return {
        ...previous,
        ...incoming,
        queueLevelMetrics: {
            ...(previous?.queueLevelMetrics ?? {}),
            ...(incoming.queueLevelMetrics ?? {})
        },
        stableMetrics: {
            ...(previous?.stableMetrics ?? {}),
            ...(incoming.stableMetrics ?? {})
        },
        channelStatsAlerts: Array.from(mergedChannelAlertsBySid.values())
    };
};

const toNumber = (value: number | string | undefined): number => {
    if (value === undefined) {
        return 0;
    }

    if (typeof value === "number") {
        return value;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
};

// A metric is "in alert" when the backend flags a non-nominal alert level.
const NOMINAL_ALERTS = new Set(["", "ok", "none", "normal", "healthy", "green", "low"]);
const isAlert = (level?: string): boolean => !!level && !NOMINAL_ALERTS.has(level.toLowerCase());

const sumMetric = (
    queues: HighlightedMetricsSubscriptionPayload[],
    getter: (item: HighlightedMetricsSubscriptionPayload) => number
): number => queues.reduce((sum, item) => sum + getter(item), 0);

// Agent availability is reported instance-wide and repeated on every queue's
// event, so it must NOT be summed across queues (that multiplies the count by
// the number of subscribed queues). Take a single representative value; max is
// robust against queues that have not reported AgentMetrics yet.
const instanceMetric = (
    queues: HighlightedMetricsSubscriptionPayload[],
    getter: (item: HighlightedMetricsSubscriptionPayload) => number
): number => queues.reduce((best, item) => Math.max(best, getter(item)), 0);

// Average of a per-queue metric, ignoring queues that never reported it.
const averageMetric = (
    queues: HighlightedMetricsSubscriptionPayload[],
    getter: (item: HighlightedMetricsSubscriptionPayload) => MetricEntry | undefined
): number | null => {
    const values = queues
        .map((item) => getter(item))
        .filter((entry): entry is MetricEntry => !!entry && entry.metricValue !== undefined)
        .map((entry) => toNumber(entry.metricValue));

    if (values.length === 0) {
        return null;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const anyAlert = (
    queues: HighlightedMetricsSubscriptionPayload[],
    getter: (item: HighlightedMetricsSubscriptionPayload) => MetricEntry | undefined
): boolean => queues.some((item) => isAlert(getter(item)?.alertLevel));

// SlaMetrics fields (averageWaitingTime, slaPercentage) are already final, backend-computed
// values reported instance-wide, not per-queue partials — so they must not be averaged across
// queues. Take a single representative value; max is robust against queues that have not
// reported SlaMetrics yet. Returns null (not 0) when no queue has reported the field.
const representativeNumberMetric = (
    queues: HighlightedMetricsSubscriptionPayload[],
    getter: (item: HighlightedMetricsSubscriptionPayload) => number | undefined
): number | null => {
    const values = queues.map(getter).filter((value): value is number => value !== undefined);

    if (values.length === 0) {
        return null;
    }

    return Math.max(...values);
};

const buildSummary = (queues: HighlightedMetricsSubscriptionPayload[]): InsightsSummary => {
    const availableAgents = instanceMetric(queues, (item) => toNumber(item.stableMetrics?.availableAgents));
    const unavailableAgents = instanceMetric(queues, (item) => toNumber(item.stableMetrics?.unavailableAgents));
    const offlineAgents = instanceMetric(queues, (item) => toNumber(item.stableMetrics?.offlineAgents));

    return {
        availableAgents,
        unavailableAgents,
        offlineAgents,
        totalAgents: availableAgents + unavailableAgents + offlineAgents,
        activeTasks: sumMetric(
            queues,
            (item) => toNumber(item.stableMetrics?.assignedTasks) + toNumber(item.stableMetrics?.wrappingTasks)
        ),
        waitingTasks: sumMetric(
            queues,
            (item) => toNumber(item.stableMetrics?.pendingTasks) + toNumber(item.stableMetrics?.reservedTasks)
        ),
        avgWaitSeconds: representativeNumberMetric(queues, (item) =>
            item.stableMetrics?.averageWaitingTime === undefined
                ? undefined
                : item.stableMetrics.averageWaitingTime / 1000
        ),
        slaPercentage: representativeNumberMetric(queues, (item) =>
            item.stableMetrics?.slaPercentage === undefined ? undefined : item.stableMetrics.slaPercentage * 100
        ),
        activeTasksAlert: anyAlert(queues, (item) => item.queueLevelMetrics?.activeTasks),
        waitingTasksAlert: anyAlert(queues, (item) => item.queueLevelMetrics?.waitingTasks),
        avgWaitAlert: anyAlert(queues, (item) => item.queueLevelMetrics?.averageWaitingTime),
        slaAlert: anyAlert(queues, (item) => item.queueLevelMetrics?.slaPercentage)
    };
};

const formatDuration = (seconds: number | null): string => {
    if (seconds === null || Number.isNaN(seconds)) {
        return "—";
    }

    const total = Math.max(0, Math.round(seconds));
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const pad = (value: number) => value.toString().padStart(2, "0");

    return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
};

const formatPercent = (value: number | null): string => (value === null ? "—" : `${Math.round(value)}%`);

function LegendItem({ color, label, value }: { color: BoxProps["backgroundColor"]; label: string; value: number }) {
    return (
        <Box display="flex" alignItems="center" columnGap="space20">
            <Box width="10px" height="10px" borderRadius="borderRadiusCircle" backgroundColor={color} />
            <Text as="span" fontSize="fontSize30" color="colorTextWeak">
                {label}
            </Text>
            <Text as="span" fontSize="fontSize30" fontWeight="fontWeightSemibold" color="colorText">
                {value}
            </Text>
        </Box>
    );
}

export function Insights({ sdkClient }: InsightsProps) {
    const { queues, refetchQueues } = useQueues(sdkClient);
    const queueSids = queues.map((queue) => queue.sid);

    useEffect(() => {
        refetchQueues();
    }, [sdkClient]);

    const [payloadByQueueSid, setPayloadByQueueSid] = useState<Record<string, HighlightedMetricsSubscriptionPayload>>(
        {}
    );
    const [eventsCount, setEventsCount] = useState(0);
    const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

    useDataClientSubscription(HIGHLIGHTED_METRICS_QUERY, {
        shouldResubscribe: true,
        variables: {
            input: {
                queues: queueSids
            }
        },
        skip: queueSids.length === 0,
        onData: (response) => {
            const { loading, error, data } = response.data;

            if (error) {
                console.error("Subscription error:", error);
                setSubscriptionError(error.message);
                return;
            }

            if (loading) {
                return;
            }

            const payload = data?.highlightedMetrics;

            if (!payload) {
                return;
            }

            if (payload.queueSid) {
                setPayloadByQueueSid((prev) => ({
                    ...prev,
                    [payload.queueSid as string]: mergePayload(prev[payload.queueSid as string], payload)
                }));
            }
            setEventsCount((count) => count + 1);
            setSubscriptionError(null);
        },
        onError: (error) => {
            console.error("Subscription error:", error);
            setSubscriptionError(error.message);
        }
    });

    const monitoredQueues = useMemo(() => Object.values(payloadByQueueSid), [payloadByQueueSid]);
    const summary = useMemo(() => buildSummary(monitoredQueues), [monitoredQueues]);

    const queueNameBySid = useMemo(() => {
        const map: Record<string, string> = {};
        queues.forEach((queue) => {
            map[queue.sid] = queue.queueName ?? queue.sid;
        });
        return map;
    }, [queues]);

    const total = summary.totalAgents || 1;
    const availablePct = (summary.availableAgents / total) * 100;
    const unavailablePct = (summary.unavailableAgents / total) * 100;
    const offlinePct = (summary.offlineAgents / total) * 100;

    return (
        <Theme.Provider theme="dark">
            <Box margin="space30" display="flex" flexDirection="column" rowGap="space50">
                <Box display="flex" flexDirection="column" rowGap="space20">
                    <Text
                        as="span"
                        fontSize="fontSize20"
                        fontWeight="fontWeightSemibold"
                        color="colorTextError"
                        textTransform="uppercase"
                    >
                        Real-time
                    </Text>
                    <Box
                        as="h2"
                        color="colorText"
                        style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 800,
                            fontSize: "28px",
                            letterSpacing: "0.02em",
                            margin: "6px 0 4px"
                        }}
                    >
                        Queues stats monitoring
                    </Box>
                    <Text as="p" color="colorTextWeak">
                        {monitoredQueues.length}/{queueSids.length} queues subscribed · updated live
                    </Text>
                </Box>

                <Box
                    display="grid"
                    gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
                    columnGap="space40"
                    rowGap="space40"
                >
                    <MetricTile
                        label="Active tasks"
                        value={summary.activeTasks}
                        caption="in progress now"
                        alert={summary.activeTasksAlert}
                    />
                    <MetricTile
                        label="Waiting tasks"
                        value={summary.waitingTasks}
                        caption="in queue"
                        alert={summary.waitingTasksAlert}
                    />
                    <MetricTile
                        label="Avg wait"
                        value={formatDuration(summary.avgWaitSeconds)}
                        caption="across queues"
                        alert={summary.avgWaitAlert}
                    />
                    <MetricTile
                        label="Service level"
                        value={formatPercent(summary.slaPercentage)}
                        caption="SLA attainment"
                        alert={summary.slaAlert}
                    />
                </Box>

                <Card rowGap="space40" style={{ fontFamily: "var(--font-mono)" }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Heading as="h3" variant="heading30" marginBottom="space0">
                            Agents
                        </Heading>
                        <Text as="span" fontSize="fontSize30" color="colorTextWeak">
                            {summary.totalAgents} total
                        </Text>
                    </Box>

                    <Box
                        display="flex"
                        height="12px"
                        width="100%"
                        borderRadius="borderRadius30"
                        overflow="hidden"
                        backgroundColor="colorBackgroundStrong"
                    >
                        <Box width={`${availablePct}%`} backgroundColor="colorBackgroundPrimaryStrong" />
                        <Box width={`${unavailablePct}%`} backgroundColor="colorBackgroundStrong" />
                        <Box width={`${offlinePct}%`} backgroundColor="colorBackgroundError" />
                    </Box>

                    <Box display="flex" columnGap="space70" rowGap="space30" flexWrap="wrap">
                        <LegendItem
                            color="colorBackgroundPrimaryStrong"
                            label="Available"
                            value={summary.availableAgents}
                        />
                        <LegendItem
                            color="colorBackgroundStrong"
                            label="Unavailable"
                            value={summary.unavailableAgents}
                        />
                        <LegendItem color="colorBackgroundError" label="Offline" value={summary.offlineAgents} />
                    </Box>
                </Card>

                <Box display="flex" columnGap="space40" rowGap="space40" flexWrap="wrap">
                    <Card flex="1 1 260px" minWidth={240} rowGap="space30" style={{ fontFamily: "var(--font-mono)" }}>
                        <Heading as="h3" variant="heading30" marginBottom="space0">
                            Queue subscriptions
                        </Heading>
                        <Box display="flex" flexDirection="column" rowGap="space30">
                            {monitoredQueues.length === 0 && (
                                <Text as="p" color="colorTextWeak">
                                    Waiting for queue data…
                                </Text>
                            )}
                            {monitoredQueues.map((queue) => (
                                <Box
                                    key={queue.queueSid}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    columnGap="space40"
                                >
                                    <Box display="flex" flexDirection="column">
                                        <Text as="span" fontSize="fontSize40" fontWeight="fontWeightSemibold">
                                            {queueNameBySid[queue.queueSid ?? ""] ?? queue.queueSid}
                                        </Text>
                                        <Text as="span" fontSize="fontSize20" color="colorTextWeak">
                                            {queue.queueSid}
                                        </Text>
                                    </Box>
                                    <Badge as="span" variant="error">
                                        Live
                                    </Badge>
                                </Box>
                            ))}
                        </Box>
                    </Card>

                    <Card flex="1 1 260px" minWidth={240} rowGap="space30" style={{ fontFamily: "var(--font-mono)" }}>
                        <Heading as="h3" variant="heading30" marginBottom="space0">
                            Subscription events
                        </Heading>
                        <Box display="flex" alignItems="baseline" columnGap="space30">
                            <Text
                                as="span"
                                fontSize="fontSize100"
                                fontWeight="fontWeightBold"
                                color="colorText"
                                style={{ fontFamily: "var(--font-buffalo)" }}
                            >
                                {eventsCount}
                            </Text>
                            <Text as="span" fontSize="fontSize30" color="colorTextWeak">
                                received this session
                            </Text>
                        </Box>
                        {subscriptionError && (
                            <Text as="p" color="colorTextError">
                                Subscription error: {subscriptionError}
                            </Text>
                        )}
                    </Card>
                </Box>
            </Box>
        </Theme.Provider>
    );
}
