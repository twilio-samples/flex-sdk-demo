import { Box, Button, Text } from "@twilio-paste/core";
import { useElapsedTimeCounter } from "../hooks/useElapsedTimeCounter";
import { useReservations } from "../hooks/useReservations";
import { AcceptIcon } from "@twilio-paste/icons/esm/AcceptIcon";
import { CloseIcon } from "@twilio-paste/icons/esm/CloseIcon";
import { getTaskName } from "../utils/TaskUtils";
import { AcceptTask, RejectTask } from "@twilio/flex-sdk/actions/Task";
import { Client } from "@twilio/flex-sdk/actions/Conversation";
import { PausedConversationsModal } from "./PausedConversationsModal";
import { CreateEmailTaskModal } from "./CreateEmailTaskModal";
import { SMSIcon } from "@twilio-paste/icons/esm/SMSIcon";
import { EmailIcon } from "@twilio-paste/icons/esm/EmailIcon";
import { ChatIcon } from "@twilio-paste/icons/esm/ChatIcon";
import { CallIcon } from "@twilio-paste/icons/esm/CallIcon";

import { useLastMessages } from "../hooks/useLastMessages";

export function TaskList({ client, onSelectTask }: { client: Client; onSelectTask: (reservationSid: string) => void }) {
    const reservations = useReservations();

    const lastMessages = useLastMessages(client, reservations);

    return (
        <Box height={"100%"} display={"flex"} flexDirection={"column"}>
            <Box flex={1}>
                <Box display="flex" alignItems="center">
                    <Box flex={1}>
                        <Text as="h4" fontSize={"fontSize50"} padding="space40" color="colorTextBrandInverse">
                            Tasks
                        </Text>
                    </Box>

                    <CreateEmailTaskModal client={client} />
                </Box>

                {reservations.length === 0 && (
                    <>
                        <Text as="span" fontSize={"fontSize30"} padding="space40" color="colorTextBrandInverse">
                            No Tasks
                        </Text>
                    </>
                )}
                {reservations.map((reservation) => (
                    <Box
                        key={reservation.sid}
                        padding="space30"
                        marginBottom="space30"
                        backgroundColor="colorBackgroundBodyInverse"
                        onClick={() => {
                            onSelectTask(reservation.sid);
                        }}
                        display="flex"
                    >
                        <TaskListIcon taskType={reservation.task.taskChannelUniqueName} />
                        <Box flex={1}>
                            <Box padding="space20" fontWeight="fontWeightBold" color="colorTextInverse">
                                {getTaskName(reservation.task.attributes)}
                            </Box>
                            <TaskListItemContent
                                taskContent={lastMessages.get(reservation.task.sid)?.lastMessage || reservation.status}
                                callTime={new Date(reservation.task.dateCreated)}
                            />
                        </Box>
                        {reservation.status === "pending" && (
                            <Box>
                                <Button
                                    variant="primary_icon"
                                    size="reset"
                                    onClick={() => {
                                        client.execute(
                                            new AcceptTask(reservation.task.sid, {
                                                conferenceOptions: {
                                                    endConferenceOnCustomerExit: true,
                                                    endConferenceOnExit: false
                                                }
                                            })
                                        );
                                    }}
                                >
                                    <Box
                                        padding={"space20"}
                                        marginRight={"space30"}
                                        borderRadius={"borderRadiusCircle"}
                                        backgroundColor={"colorBackground"}
                                    >
                                        <AcceptIcon decorative={false} title="Accept" />
                                    </Box>
                                </Button>

                                <Button
                                    variant="primary_icon"
                                    size="reset"
                                    onClick={() => {
                                        client.execute(new RejectTask(reservation.task.sid));
                                    }}
                                >
                                    <Box
                                        padding={"space20"}
                                        borderRadius={"borderRadiusCircle"}
                                        backgroundColor={"colorBackground"}
                                    >
                                        <CloseIcon decorative={false} title="Reject" />
                                    </Box>
                                </Button>
                            </Box>
                        )}
                    </Box>
                ))}
            </Box>

            <Box>
                <PausedConversationsModal client={client} />
            </Box>
        </Box>
    );
}

export function TaskListIcon({ taskType }: { taskType: string }): JSX.Element {
    let icon = <SMSIcon decorative={false} title="SMS" />;
    if (taskType === "email") {
        icon = <EmailIcon decorative={false} title="Email" />;
    } else if (taskType === "chat") {
        icon = <ChatIcon decorative={false} title="Chat" />;
    } else if (taskType === "voice") {
        icon = <CallIcon decorative={false} title="Voice" />;
    } else if (taskType === "sms") {
        icon = <SMSIcon decorative={false} title="SMS" />;
    }
    return (
        <Box
            padding={"space20"}
            marginRight={"space30"}
            marginTop={"space20"}
            height={"sizeIcon50"}
            borderRadius={"borderRadiusCircle"}
            backgroundColor={"colorBackground"}
        >
            {icon}
        </Box>
    );
}

export function TaskListItemContent({ taskContent, callTime }: { taskContent: string; callTime: Date }): JSX.Element {
    const { elapsedTime } = useElapsedTimeCounter(callTime);
    return (
        <Box flexDirection="row" alignItems="center" paddingLeft="space20" paddingRight="space20">
            <Text as="span" color="colorTextInverse" lineHeight="lineHeight30" fontSize="fontSize30">
                {elapsedTime}
            </Text>
            <Text as="span" color="colorTextInverse" lineHeight="lineHeight30" fontSize="fontSize30">
                {" | "}
            </Text>
            {taskContent && (
                <Text
                    as="span"
                    color="colorTextInverse"
                    lineHeight="lineHeight30"
                    fontSize="fontSize30"
                    textOverflow={"ellipsis"}
                    overflow={"hidden"}
                    title={taskContent}
                >
                    {taskContent?.substring(0, 25)}
                    {taskContent.length > 25 ? "..." : ""}
                </Text>
            )}
        </Box>
    );
}
