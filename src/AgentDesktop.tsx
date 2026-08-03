import { useEffect, useState } from "react";
import { Box, Button, Tooltip } from "@twilio-paste/core";
import { Theme } from "@twilio-paste/theme";
import { AgentIcon } from "@twilio-paste/icons/esm/AgentIcon";
import { ProductInsightsIcon } from "@twilio-paste/icons/esm/ProductInsightsIcon";
import { Header } from "./components/Header";
import { TaskList } from "./components/TaskList";
import { ConversationPanel } from "./components/ConversationPanel";
import { TaskHeaderPanel } from "./components/TaskHeaderPanel";
import { CallPanel } from "./components/CallPanel";
import { Insights } from "./components/Insights";
import { ConnectionStateBanner } from "./components/ConnectionStateBanner";
import { MonitoredCall, MonitoredCallPanel } from "./components/MonitoredCallPanel";
import { useReservations } from "./hooks/useReservations";
import { Client, VoiceCall } from "@twilio/flex-sdk";
import type { SdkConnectionState } from "@twilio/flex-sdk";
import { DataClientProvider } from "@twilio/flex-sdk/data-client";
import type { FlexDataClient } from "@twilio/flex-sdk/data-client";
import type { Worker } from "@twilio/flex-sdk/taskrouter";

type DesktopView = "agent" | "queuesStats";

export function AgentDesktop({
    sdkClient,
    voiceCall,
    worker,
    dataClient,
    connectionState
}: {
    sdkClient: Client;
    voiceCall: VoiceCall | null | undefined;
    worker: Worker | null | undefined;
    dataClient: FlexDataClient;
    connectionState: SdkConnectionState | undefined;
}) {
    const [reservationSid, setReservationSid] = useState<string>();
    const [monitoredCall, setMonitoredCall] = useState<MonitoredCall | null>(null);
    const [activeView, setActiveView] = useState<DesktopView>("agent");
    const reservations = useReservations();
    const isSupervisorOrAdmin =
        worker?.attributes?.roles?.includes("supervisor") ||
        worker?.attributes?.roles?.includes("admin") ||
        worker?.attributes?.role === "supervisor" ||
        worker?.attributes?.role === "admin";

    useEffect(() => {
        if (!reservationSid) {
            setReservationSid("");
            return;
        }
        if (reservations.findIndex((r) => r.sid === reservationSid) === -1) {
            setReservationSid("");
        }
    }, [reservations, reservationSid]);

    const isVoiceTask =
        reservationSid && worker?.reservations.get(reservationSid)?.task.taskChannelUniqueName === "voice";

    const agentView = (
        <Box display={"flex"} flex={1} minHeight={0}>
            <Box flexShrink={0} width="27%" minWidth="420px" className="task-rail">
                <TaskList client={sdkClient} onSelectTask={(reservationSid) => setReservationSid(reservationSid)} />
            </Box>
            <Box flex={1} display="flex" flexDirection={"column"} minHeight={0} overflowY="auto" padding="space100">
                {monitoredCall && (
                    <MonitoredCallPanel
                        client={sdkClient}
                        monitoredCall={monitoredCall}
                        onEnd={() => setMonitoredCall(null)}
                    />
                )}
                {reservationSid && (
                    <Box display={"flex"} flexDirection="column" flex={1} height={"100%"}>
                        <TaskHeaderPanel
                            key={"taskheader" + reservationSid}
                            client={sdkClient}
                            reservationSid={reservationSid}
                        />

                        {!isVoiceTask && worker && (
                            <ConversationPanel
                                key={"conversation" + reservationSid}
                                client={sdkClient}
                                worker={worker}
                                reservationSid={reservationSid!}
                            />
                        )}
                        {isVoiceTask && worker && voiceCall && (
                            <CallPanel
                                call={voiceCall}
                                client={sdkClient}
                                worker={worker}
                                reservationSid={reservationSid!}
                            />
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );

    return (
        <Box display="flex" flexDirection={"column"} height={"100vh"}>
            {connectionState && <ConnectionStateBanner connectionState={connectionState} />}
            <Header client={sdkClient} worker={worker} onMonitorStarted={setMonitoredCall} />
            {isSupervisorOrAdmin ? (
                <Box display={"flex"} flex={1} minHeight={0}>
                    <Theme.Provider theme="dark" style={{ display: "flex" }}>
                        <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            rowGap="space40"
                            paddingY="space50"
                            paddingX="space40"
                            borderRightWidth="borderWidth10"
                            borderRightStyle="solid"
                            borderRightColor="colorBorderWeaker"
                            backgroundColor="colorBackgroundBody"
                        >
                            <Tooltip text="Agent">
                                <Button
                                    variant="secondary_icon"
                                    size="icon"
                                    pressed={activeView === "agent"}
                                    aria-label="Agent"
                                    onClick={() => setActiveView("agent")}
                                >
                                    <AgentIcon decorative />
                                </Button>
                            </Tooltip>
                            <Tooltip text="Queues Stats">
                                <Button
                                    variant="secondary_icon"
                                    size="icon"
                                    pressed={activeView === "queuesStats"}
                                    aria-label="Queues Stats"
                                    onClick={() => setActiveView("queuesStats")}
                                >
                                    <ProductInsightsIcon decorative />
                                </Button>
                            </Tooltip>
                        </Box>
                    </Theme.Provider>
                    <Box flex={1} display="flex" flexDirection="column" minHeight={0}>
                        <Box
                            display={activeView === "agent" ? "flex" : "none"}
                            flexDirection="column"
                            flex={1}
                            minHeight={0}
                            role="tabpanel"
                            aria-label="Agent"
                        >
                            {agentView}
                        </Box>
                        <Box
                            display={activeView === "queuesStats" ? "flex" : "none"}
                            flexDirection="column"
                            flex={1}
                            minHeight={0}
                            overflowY="auto"
                            role="tabpanel"
                            aria-label="Queues Stats"
                        >
                            <DataClientProvider dataClient={dataClient}>
                                <Insights sdkClient={sdkClient} />
                            </DataClientProvider>
                        </Box>
                    </Box>
                </Box>
            ) : (
                agentView
            )}
        </Box>
    );
}
