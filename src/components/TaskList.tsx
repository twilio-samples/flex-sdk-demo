import { Badge, Box, Button, Text } from "@twilio-paste/core";
import { Theme } from "@twilio-paste/theme";
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
import { Card } from "./ui/Card";
import { TASK_CONTENT_MAX_LENGTH } from "../constants";

export interface TaskListProps {
    client: Client;
    onSelectTask: (reservationSid: string) => void;
}

export function TaskList({ client, onSelectTask }: TaskListProps) {
    const reservations = useReservations();
    const lastMessages = useLastMessages(client, reservations);

    return (
        <Theme.Provider theme="dark">
            <Box
                height="100%"
                display="flex"
                flexDirection="column"
                backgroundColor="colorBackgroundBody"
                borderRightWidth="borderWidth10"
                borderRightStyle="solid"
                borderRightColor="colorBorderWeaker"
            >
                <Box display="flex" alignItems="center" justifyContent="space-between" padding="space60">
                    <Box display="flex" alignItems="center" columnGap="space20">
                        <Text as="h4" fontSize="fontSize70" fontWeight="fontWeightBold" color="colorText">
                            Tasks
                        </Text>
                        <Badge as="span" variant="neutral">
                            {reservations.length}
                        </Badge>
                    </Box>
                    <CreateEmailTaskModal client={client} />
                </Box>

                <Box
                    flex={1}
                    overflowY="auto"
                    paddingX="space60"
                    paddingBottom="space60"
                    display="flex"
                    flexDirection="column"
                    rowGap="space40"
                >
                    {reservations.length === 0 && (
                        <Box
                            flex={1}
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            rowGap="space40"
                            paddingX="space60"
                        >
                            <EmailIcon decorative size="sizeIcon80" color="colorTextWeak" />
                            <Text as="span" fontSize="fontSize50" fontWeight="fontWeightSemibold" color="colorTextWeak">
                                No active tasks
                            </Text>
                            <Text as="span" fontSize="fontSize40" color="colorTextWeak" textAlign="center">
                                New conversations you accept will show up here.
                            </Text>
                        </Box>
                    )}

                    {reservations.map((reservation) => {
                        const isPending =
                            reservation.status === "pending" && reservation.task.attributes.direction !== "outbound";
                        return (
                            <Card
                                key={reservation.sid}
                                padding="space40"
                                borderWidth="borderWidth10"
                                cursor="pointer"
                                onClick={() => onSelectTask(reservation.sid)}
                                flexDirection="row"
                                alignItems="center"
                                columnGap="space30"
                            >
                                <TaskListIcon taskType={reservation.task.taskChannelUniqueName} />
                                <Box flex={1} minWidth={0}>
                                    <Text
                                        as="span"
                                        fontSize="fontSize40"
                                        fontWeight="fontWeightSemibold"
                                        color="colorText"
                                    >
                                        {getTaskName(reservation.task.attributes)}
                                    </Text>
                                    <TaskListItemContent
                                        taskContent={
                                            lastMessages.get(reservation.task.sid)?.lastMessage || reservation.status
                                        }
                                        callTime={new Date(reservation.task.dateCreated)}
                                    />
                                    <Box marginTop="space20" display="flex" flexDirection="column" rowGap="space10">
                                        <Text
                                            as="span"
                                            fontSize="fontSize10"
                                            color="colorTextWeak"
                                            title={reservation.task.sid}
                                            style={{ wordBreak: "break-all" }}
                                        >
                                            Task: {reservation.task.sid}
                                        </Text>
                                        <Text
                                            as="span"
                                            fontSize="fontSize10"
                                            color="colorTextWeak"
                                            title={reservation.sid}
                                            style={{ wordBreak: "break-all" }}
                                        >
                                            Reservation: {reservation.sid}
                                        </Text>
                                    </Box>
                                </Box>

                                {isPending ? (
                                    <Box display="flex" columnGap="space20">
                                        <Button
                                            variant="primary_icon"
                                            size="reset"
                                            onClick={(e) => {
                                                e.stopPropagation();
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
                                                padding="space20"
                                                borderRadius="borderRadiusCircle"
                                                backgroundColor="colorBackgroundStrong"
                                            >
                                                <AcceptIcon decorative={false} title="Accept" />
                                            </Box>
                                        </Button>
                                        <Button
                                            variant="destructive_icon"
                                            size="reset"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                client.execute(new RejectTask(reservation.task.sid));
                                            }}
                                        >
                                            <Box
                                                padding="space20"
                                                borderRadius="borderRadiusCircle"
                                                backgroundColor="colorBackgroundStrong"
                                            >
                                                <CloseIcon decorative={false} title="Reject" />
                                            </Box>
                                        </Button>
                                    </Box>
                                ) : (
                                    <Badge as="span" variant="neutral">
                                        {reservation.status}
                                    </Badge>
                                )}
                            </Card>
                        );
                    })}
                </Box>

                <Box
                    padding="space60"
                    borderTopWidth="borderWidth10"
                    borderTopStyle="solid"
                    borderTopColor="colorBorderWeaker"
                >
                    <PausedConversationsModal client={client} />
                </Box>
            </Box>
        </Theme.Provider>
    );
}

export interface TaskListIconProps {
    taskType: string;
}

export function TaskListIcon({ taskType }: TaskListIconProps): JSX.Element {
    let icon = <SMSIcon decorative={false} title="SMS" color="colorTextError" />;
    if (taskType === "email") {
        icon = <EmailIcon decorative={false} title="Email" color="colorTextError" />;
    } else if (taskType === "chat") {
        icon = <ChatIcon decorative={false} title="Chat" color="colorTextError" />;
    } else if (taskType === "voice") {
        icon = <CallIcon decorative={false} title="Voice" color="colorTextError" />;
    }
    return (
        <Box padding="space30" borderRadius="borderRadius20" backgroundColor="colorBackgroundStrong">
            {icon}
        </Box>
    );
}

export interface TaskListItemContentProps {
    taskContent: string;
    callTime: Date;
}

export function TaskListItemContent({ taskContent, callTime }: TaskListItemContentProps): JSX.Element {
    const { elapsedTime } = useElapsedTimeCounter(callTime);
    return (
        <Box display="flex" alignItems="center" columnGap="space20" marginTop="space10">
            <Text as="span" color="colorTextWeak" lineHeight="lineHeight30" fontSize="fontSize30">
                {elapsedTime}
            </Text>
            {taskContent && (
                <Text
                    as="span"
                    color="colorTextWeak"
                    lineHeight="lineHeight30"
                    fontSize="fontSize30"
                    textOverflow="ellipsis"
                    overflow="hidden"
                    title={taskContent}
                >
                    · {taskContent.substring(0, TASK_CONTENT_MAX_LENGTH)}
                    {taskContent.length > TASK_CONTENT_MAX_LENGTH ? "…" : ""}
                </Text>
            )}
        </Box>
    );
}
