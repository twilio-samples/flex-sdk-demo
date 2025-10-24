import { useEffect, useState } from "react";
import { Box } from "@twilio-paste/core";
import { Header } from "./components/Header";
import { TaskList } from "./components/TaskList";
import { ConversationPanel } from "./components/ConversationPanel";
import { TaskHeaderPanel } from "./components/TaskHeaderPanel";
import { CallPanel } from "./components/CallPanel";
import { useReservations } from "./hooks/useReservations";
import { Client, VoiceCall } from "@twilio/flex-sdk";
import type { Worker } from "@twilio/flex-sdk/taskrouter";

export function AgentDesktop({
    sdkClient,
    voiceCall,
    worker
}: {
    sdkClient: Client;
    voiceCall: VoiceCall | null | undefined;
    worker: Worker | null | undefined;
}) {
    const [reservationSid, setReservationSid] = useState<string>();
    const reservations = useReservations();

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

    return (
        <Box display="flex" flexDirection={"column"} height={"100vh"}>
            <Header client={sdkClient} worker={worker} />
            <Box display={"flex"} height={"100%"}>
                <Box flex={1} minWidth={280}>
                    <TaskList client={sdkClient} onSelectTask={(reservationSid) => setReservationSid(reservationSid)} />
                </Box>
                <Box flex={4} flexDirection={"column"} height={"100%"}>
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
        </Box>
    );
}
