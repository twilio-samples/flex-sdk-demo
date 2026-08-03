import { Box, FormPill, FormPillGroup, Input, Text, useFormPillState } from "@twilio-paste/core";
import { Reservation } from "@twilio/flex-sdk";
import {
    AddEmailParticipant,
    Client,
    ParticipantLevel,
    RemoveEmailParticipant,
    TaskParticipant
} from "@twilio/flex-sdk/actions/Conversation";
import HTMLEditor from "react-simple-wysiwyg";

export interface EmailEditorProps {
    client: Client;
    reservation: Reservation;
    htmlInput: string;
    participants: TaskParticipant[];
    subject: string;
    setSubject: (subject: string) => void;
    onChange: (newValue: string) => void;
    onParticipantsChange: () => void;
}

export function EmailEditor({
    client,
    reservation,
    htmlInput,
    participants,
    subject,
    setSubject,
    onChange,
    onParticipantsChange
}: EmailEditorProps): JSX.Element {
    return (
        <Box>
            <Box>
                <ParticipantLevelLine
                    client={client}
                    level={ParticipantLevel.To}
                    participants={participants}
                    reservation={reservation}
                    onParticipantsChange={onParticipantsChange}
                />
                <ParticipantLevelLine
                    client={client}
                    level={ParticipantLevel.CC}
                    participants={participants}
                    reservation={reservation}
                    onParticipantsChange={onParticipantsChange}
                />
                <Box display={"flex"} alignItems={"center"} columnGap="space30" marginBottom={"space40"}>
                    <Text as="span" color="colorText" fontWeight="fontWeightSemibold">
                        Subject:
                    </Text>
                    <Box flex={1}>
                        <Input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </Box>
                </Box>
            </Box>
            <Box className="email-editor">
                <HTMLEditor value={htmlInput} onChange={(e) => onChange(e.target.value)} />
            </Box>
        </Box>
    );
}

export interface ParticipantLevelLineProps {
    reservation: Reservation;
    client: Client;
    participants: TaskParticipant[];
    level: ParticipantLevel;
    onParticipantsChange: () => void;
}

export function ParticipantLevelLine({
    client,
    level,
    participants,
    reservation,
    onParticipantsChange
}: ParticipantLevelLineProps): JSX.Element {
    const pillState = useFormPillState();

    return (
        <Box display={"flex"} alignItems={"center"} marginBottom={"space40"}>
            <Text as="span" color="colorText" fontWeight="fontWeightSemibold" marginRight={"space30"}>
                {level.toLocaleUpperCase().substring(0, 1) + level.substring(1)}:
            </Text>
            <FormPillGroup {...pillState} aria-label="Products:">
                {participants
                    .filter(
                        (p) =>
                            !!p.mediaProperties?.messagingBinding && p.mediaProperties?.messagingBinding.level === level
                    )
                    .map((participant) => {
                        return (
                            <FormPill
                                {...pillState}
                                key={participant.participantSid}
                                onDismiss={() => {
                                    client
                                        .execute(
                                            new RemoveEmailParticipant(reservation.task.sid, participant.participantSid)
                                        )
                                        .then(() => {
                                            onParticipantsChange();
                                        });
                                }}
                            >
                                {participant.mediaProperties?.messagingBinding?.address}
                            </FormPill>
                        );
                    })}
            </FormPillGroup>
            <Box flex={1}>
                <input
                    type="text"
                    style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: "inherit",
                        height: "100%",
                        width: "100%",
                        marginLeft: 8
                    }}
                    placeholder="Add Email address"
                    onKeyDownCapture={async (e) => {
                        if (e.key === "Enter") {
                            if (e.currentTarget.value.length > 0) {
                                client
                                    .execute(
                                        new AddEmailParticipant(reservation.task.sid, e.currentTarget.value, level)
                                    )
                                    .then(() => {
                                        onParticipantsChange();
                                    })
                                    .catch((error) => {
                                        console.error("Error adding participant", error);
                                        alert("Error adding participant");
                                    });
                                e.currentTarget.value = "";
                            }
                        }
                    }}
                />
            </Box>
        </Box>
    );
}
