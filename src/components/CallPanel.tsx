import { Avatar, Box, Button, Text } from "@twilio-paste/core";
import { Client } from "@twilio/flex-sdk/actions/Conversation";
import {
    HoldVoiceParticipant,
    KickVoiceParticipant,
    UnholdVoiceParticipant,
    VoiceCall
} from "@twilio/flex-sdk/actions/Voice";
import { useEffect, useState } from "react";
import { getTaskName } from "../utils/TaskUtils";
import { UserIcon } from "@twilio-paste/icons/esm/UserIcon";
import { PauseIcon } from "@twilio-paste/icons/esm/PauseIcon";
import { PlayIcon } from "@twilio-paste/icons/esm/PlayIcon";
import { MicrophoneOnIcon } from "@twilio-paste/icons/esm/MicrophoneOnIcon";
import { MicrophoneOffIcon } from "@twilio-paste/icons/esm/MicrophoneOffIcon";
import { CallHoldIcon } from "@twilio-paste/icons/esm/CallHoldIcon";

import { useParticipantState } from "../state/appState";
import { useReservation } from "../hooks/useReservation";
import { Worker } from "@twilio/flex-sdk/taskrouter";
import { getAccountConfig, StartVoiceTaskTransfer } from "@twilio/flex-sdk";
import { TransferModal } from "./TransferModal";
import { Theme } from "@twilio-paste/theme";

export function CallPanel({
    client,
    worker,
    reservationSid,
    call
}: {
    client: Client;
    reservationSid: string;
    call: VoiceCall | undefined;
    worker: Worker;
}): JSX.Element | null {
    const reservation = useReservation(reservationSid);
    const participants = useParticipantState((state) => state.participants[reservationSid]);
    const [isRecording, setIsRecording] = useState(true);
    const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);

    const [isMuted, setIsMuted] = useState(call?.isMuted());

    const workers = useParticipantState((state) => state.workers);

    const participantDisplayName =
        (reservation && getTaskName(reservation?.task.attributes)) ??
        call?.call?.customParameters.get("displayName") ??
        "Unknown";

    const isActiveCall = reservation?.status === "accepted" && !!call && call.call?.status() === "open";

    useEffect(() => {
        getAccountConfig(client.token).then((config) => {
            setIsRecordingEnabled(config.callRecordingEnabled);
        });
    }, []);

    if (!isActiveCall) {
        if (reservation?.status === "accepted") {
            return (
                <Box
                    display="flex"
                    flexDirection="row"
                    justifyContent="center"
                    alignItems="center"
                    height={300}
                    padding={"space40"}
                    backgroundColor={"colorBackgroundBodyInverse"}
                >
                    <Text as="h1" fontSize={"fontSize50"} color="colorTextBrandInverse">
                        Call is active on another session
                    </Text>
                </Box>
            );
        }
        if (reservation?.status === "wrapping") {
            return (
                <Box
                    display="flex"
                    flexDirection="row"
                    justifyContent="center"
                    alignItems="center"
                    height={300}
                    padding={"space40"}
                    backgroundColor={"colorBackgroundBodyInverse"}
                >
                    <Text as="h1" fontSize={"fontSize50"} color="colorTextBrandInverse">
                        Call ended
                    </Text>
                </Box>
            );
        }
    }
    return (
        <Theme.Provider theme="dark">
            <Box
                display="flex"
                flexDirection="row"
                justifyContent="center"
                alignItems="center"
                padding={"space40"}
                backgroundColor={"colorBackgroundBodyInverse"}
            >
                <Box
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    padding={"space40"}
                >
                    <Box paddingBottom={"space140"} display={"flex"} flex={1} flexDirection={"row"}>
                        {participants?.length &&
                            participants
                                .filter((p) => p.routingProperties?.workerSid !== worker.sid)
                                .map((participant) => {
                                    const isOnHold = participant.channelType === "voice" && participant.isOnHold;
                                    return (
                                        <Box
                                            display={"flex"}
                                            flex={1}
                                            flexDirection={"column"}
                                            alignItems="center"
                                            rowGap={"space40"}
                                            width={200}
                                            key={participant.participantSid}
                                        >
                                            <Avatar icon={UserIcon} size={"sizeIcon110"} name="User" />
                                            <Text as="span" color="colorTextBrandInverse">
                                                {participant.type === "customer"
                                                    ? participantDisplayName
                                                    : workers?.[participant.routingProperties?.workerSid || ""] ??
                                                      "Worker"}
                                            </Text>
                                            <Box display={"flex"} columnGap={"space40"}>
                                                <Button
                                                    variant="secondary"
                                                    disabled={!isActiveCall}
                                                    onClick={() => {
                                                        if (isOnHold) {
                                                            client.execute(
                                                                new UnholdVoiceParticipant(
                                                                    participant.participantSid,
                                                                    reservation!.task.sid!
                                                                )
                                                            );
                                                        } else {
                                                            client.execute(
                                                                new HoldVoiceParticipant(
                                                                    participant.participantSid,
                                                                    reservation!.task.sid!
                                                                )
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <CallHoldIcon decorative />
                                                    {isOnHold ? "Unhold" : "Hold"}
                                                </Button>
                                                {participant.type !== "customer" && (
                                                    <Button
                                                        disabled={!isActiveCall}
                                                        variant="secondary"
                                                        onClick={() => {
                                                            client.execute(
                                                                new KickVoiceParticipant(
                                                                    participant.participantSid,
                                                                    reservation!.task.sid!
                                                                )
                                                            );
                                                        }}
                                                    >
                                                        {"Kick"}
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                    </Box>
                    <Box display={"flex"} columnGap={"space40"}>
                        {isRecordingEnabled && (
                            <Button
                                disabled={!isActiveCall}
                                variant="secondary"
                                onClick={() => {
                                    if (isRecording) {
                                        call?.pauseRecording("silence").then(() => {
                                            setIsRecording(false);
                                        });
                                    } else {
                                        call?.resumeRecording().then(() => {
                                            setIsRecording(true);
                                        });
                                    }
                                }}
                            >
                                {isRecording ? <PauseIcon decorative /> : <PlayIcon decorative />}
                                {isRecording ? "Pause Recording" : "Resume Recording"}
                            </Button>
                        )}

                        <Button
                            disabled={!isActiveCall}
                            variant="secondary"
                            onClick={() => {
                                if (call?.isMuted()) {
                                    call?.unmute();
                                } else {
                                    call?.mute();
                                }
                                setIsMuted(call?.isMuted());
                            }}
                        >
                            {isMuted ? <MicrophoneOffIcon decorative /> : <MicrophoneOnIcon decorative />}
                            {isMuted ? "Unmute" : "Mute"}
                        </Button>
                        <TransferModal
                            disabled={!isActiveCall}
                            client={client}
                            canConsult
                            onSelect={(targetSid, consult) => {
                                return client
                                    .execute(
                                        new StartVoiceTaskTransfer(reservation?.task.sid!, targetSid, {
                                            mode: consult ? "WARM" : "COLD"
                                        })
                                    )
                                    .catch((error) => {
                                        console.error("Transfer failed", error);
                                        alert(`Transfer failed: ${error.message}`);
                                    });
                            }}
                        />
                        <Button
                            disabled={!isActiveCall}
                            variant="secondary"
                            onClick={() => {
                                call?.disconnect();
                            }}
                        >
                            {"End Call"}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Theme.Provider>
    );
}
