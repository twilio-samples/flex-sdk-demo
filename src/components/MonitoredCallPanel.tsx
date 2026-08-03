import { useEffect, useState } from "react";
import { Avatar, Badge, Box, Button, Text } from "@twilio-paste/core";
import { Theme } from "@twilio-paste/theme";
import { UserIcon } from "@twilio-paste/icons/esm/UserIcon";
import { Client } from "@twilio/flex-sdk/actions/Conversation";
import { BargeCall, CoachCall, VoiceCall } from "@twilio/flex-sdk/actions/Voice";
import { useElapsedTimeCounter } from "../hooks/useElapsedTimeCounter";
import { POLL_INTERVAL_MS } from "../constants";
import { Card } from "./ui/Card";

export interface MonitoredCall {
    /** The supervisor's monitoring call leg (returned by MonitorCall). */
    call: VoiceCall;
    /** The task being monitored. */
    taskSid: string;
    /** The monitored agent's reservation. */
    reservationSid: string;
}

type Mode = "monitor" | "coach" | "barge";

export interface MonitoredCallPanelProps {
    client: Client;
    monitoredCall: MonitoredCall;
    /** Called after the supervisor stops monitoring (call disconnected). */
    onEnd: () => void;
}

const MODE_LABEL: Record<Mode, string> = {
    monitor: "Listening",
    coach: "Coaching",
    barge: "Barged in"
};

/**
 * Supervisor panel for a live monitored call. Shows the monitored call and lets
 * the supervisor switch into Coach (whisper to agent) or Barge (join everyone),
 * or stop monitoring. Rendered in the same area as the Insights dashboard.
 */
export function MonitoredCallPanel({ client, monitoredCall, onEnd }: MonitoredCallPanelProps) {
    const { call, taskSid } = monitoredCall;
    const [mode, setMode] = useState<Mode>("monitor");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [startTime] = useState(() => new Date());
    const { elapsedTime } = useElapsedTimeCounter(startTime);
    const [status, setStatus] = useState<string>("");
    const [onHold, setOnHold] = useState(false);
    const [muted, setMuted] = useState(false);

    useEffect(() => {
        let active = true;
        const twilioCall = call.call;

        const refresh = async () => {
            if (!active) return;
            setStatus(twilioCall?.status() ?? "unknown");
            setMuted(Boolean(call.isMuted()));
            try {
                setOnHold(await call.isOnHold());
            } catch {
                // hold state not available for this call
            }
        };

        refresh();
        const interval = setInterval(refresh, POLL_INTERVAL_MS);

        const handleDisconnect = () => onEnd();
        twilioCall?.on("disconnect", handleDisconnect);
        twilioCall?.on("cancel", handleDisconnect);

        return () => {
            active = false;
            clearInterval(interval);
            twilioCall?.off("disconnect", handleDisconnect);
            twilioCall?.off("cancel", handleDisconnect);
        };
    }, [call, onEnd]);

    const runAction = async (next: Mode, action: () => Promise<unknown>) => {
        setBusy(true);
        setError(null);
        try {
            await action();
            setMode(next);
        } catch (err) {
            console.error(`Failed to ${next} call:`, err);
            setError(err instanceof Error ? err.message : `Failed to ${next} call`);
        } finally {
            setBusy(false);
        }
    };

    const handleCoach = () => runAction("coach", () => client.execute(new CoachCall(taskSid)));
    const handleBarge = () => runAction("barge", () => client.execute(new BargeCall(taskSid)));
    const handleToggleMute = () => {
        try {
            if (call.isMuted()) {
                call.unmute();
            } else {
                call.mute();
            }
            setMuted(Boolean(call.isMuted()));
        } catch (err) {
            console.error("Failed to toggle mute:", err);
            setError(err instanceof Error ? err.message : "Failed to toggle mute");
        }
    };
    const handleEnd = () => {
        try {
            call.disconnect();
        } catch (err) {
            console.error("Failed to disconnect monitoring call:", err);
        }
        onEnd();
    };

    return (
        <Theme.Provider theme="dark">
            <Card margin="space30" rowGap="space50">
                <Box display="flex" alignItems="center" justifyContent="space-between" columnGap="space40">
                    <Box display="flex" flexDirection="column" rowGap="space20">
                        <Text
                            as="span"
                            fontSize="fontSize20"
                            fontWeight="fontWeightSemibold"
                            color="colorTextError"
                            textTransform="uppercase"
                            style={{ letterSpacing: "0.08em" }}
                        >
                            Supervisor
                        </Text>
                        <Box
                            as="h2"
                            color="colorText"
                            style={{
                                fontFamily: "var(--font-display)",
                                fontWeight: 800,
                                fontSize: "24px",
                                letterSpacing: "0.02em",
                                margin: "2px 0"
                            }}
                        >
                            Monitoring call
                        </Box>
                        <Text as="span" fontSize="fontSize20" color="colorTextWeak" fontVariantNumeric="tabular-nums">
                            {taskSid}
                        </Text>
                    </Box>
                    <Badge as="span" variant={mode === "barge" ? "error" : mode === "coach" ? "warning" : "neutral"}>
                        {MODE_LABEL[mode]}
                    </Badge>
                </Box>

                <Box display="flex" alignItems="center" columnGap="space40">
                    <Avatar icon={UserIcon} size="sizeIcon80" name="Call" />
                    <Box display="flex" flexDirection="column">
                        <Text as="span" color="colorText" fontSize="fontSize40" fontWeight="fontWeightSemibold">
                            Live call
                        </Text>
                        <Text as="span" color="colorTextWeak" fontSize="fontSize30">
                            {mode === "monitor"
                                ? "You are listening in (muted to the call)."
                                : mode === "coach"
                                  ? "You can be heard by the agent only."
                                  : "You can be heard by everyone on the call."}
                        </Text>
                    </Box>
                </Box>

                <Box
                    display="grid"
                    gridTemplateColumns="repeat(auto-fit, minmax(120px, 1fr))"
                    columnGap="space50"
                    rowGap="space40"
                >
                    <CallStat label="Status" value={status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"} />
                    <CallStat label="Duration" value={elapsedTime} mono />
                    <CallStat label="Call" value={onHold ? "On hold" : "Active"} accent={onHold ? "hold" : undefined} />
                    <CallStat label="Your mic" value={muted ? "Muted" : "Live"} />
                </Box>

                {error && (
                    <Text as="p" color="colorTextError" fontSize="fontSize30">
                        {error}
                    </Text>
                )}

                <Box display="flex" columnGap="space40" flexWrap="wrap">
                    <Button variant="secondary" disabled={busy || mode === "coach"} onClick={handleCoach}>
                        Coach
                    </Button>
                    <Button variant="secondary" disabled={busy || mode === "barge"} onClick={handleBarge}>
                        Barge
                    </Button>
                    {/* Muting is only audible in coach/barge; while purely monitoring the
                        supervisor is already listen-only, so the toggle is a no-op there. */}
                    <Button variant="secondary" disabled={busy || mode === "monitor"} onClick={handleToggleMute}>
                        {muted ? "Unmute" : "Mute"}
                    </Button>
                    <Button variant="destructive" disabled={busy} onClick={handleEnd}>
                        Stop monitoring
                    </Button>
                </Box>
            </Card>
        </Theme.Provider>
    );
}

function CallStat({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: "hold" }) {
    return (
        <Box display="flex" flexDirection="column" rowGap="space10">
            <Text
                as="span"
                fontSize="fontSize20"
                color="colorTextWeak"
                textTransform="uppercase"
                style={{ letterSpacing: "0.06em" }}
            >
                {label}
            </Text>
            <Text
                as="span"
                fontSize="fontSize40"
                fontWeight="fontWeightSemibold"
                color={accent === "hold" ? "colorTextError" : "colorText"}
                fontVariantNumeric={mono ? "tabular-nums" : undefined}
            >
                {value}
            </Text>
        </Box>
    );
}
