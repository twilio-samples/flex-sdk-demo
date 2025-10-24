import { Box, Button } from "@twilio-paste/core";
import { ConversationsUser, EndTask, StartConversationTransfer } from "@twilio/flex-sdk";
import {
    Client,
    GetConversationsUser,
    LeaveConversation,
    PauseConversation,
    TaskParticipant
} from "@twilio/flex-sdk/actions/Conversation";
import { getTaskName } from "../utils/TaskUtils";
import { TaskListItemContent } from "./TaskList";
import { CompleteTask, GetTaskParticipants } from "@twilio/flex-sdk/actions/Task";
import { useReservations } from "../hooks/useReservations";
import { TransferModal } from "./TransferModal";
import { useEffect, useState } from "react";

export function TaskHeaderPanel({ client, reservationSid }: { client: Client; reservationSid: string }): JSX.Element {
    const reservations = useReservations();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_participants, setParticipants] = useState<TaskParticipant[]>([]);
    const [conversationUser, setConversationUser] = useState<ConversationsUser>();
    const [isOnline, setIsOnline] = useState(false);

    const reservation = reservations.find((reservation) => reservation.sid === reservationSid);

    const fetchParticipants = async () => {
        if (!reservation || reservation.task.taskChannelUniqueName === "voice") {
            return;
        }
        const response = await client.execute(new GetTaskParticipants(reservation.task.sid!));
        setParticipants(response);

        const customerParticipant = response.find((r) => r.type === "customer");

        if (customerParticipant) {
            const conversationsUser = await client.execute(
                new GetConversationsUser(customerParticipant.mediaProperties?.identity)
            );
            setConversationUser(conversationsUser);

            if (conversationsUser) {
                setIsOnline(!!conversationsUser.isOnline);
            }
        }
    };

    useEffect(() => {
        setIsOnline(!!conversationUser?.isOnline);
        const listener = ({ user }: { user: ConversationsUser }) => {
            setIsOnline(!!user.isOnline);
        };
        conversationUser?.on("updated", listener);
        return () => {
            conversationUser?.removeListener("updated", listener);
        };
    }, [conversationUser]);

    useEffect(() => {
        fetchParticipants();
    }, [reservationSid]);

    return (
        <Box
            padding="space40"
            color={"colorTextInverse"}
            paddingRight={"space40"}
            display={"flex"}
            borderBottomWidth={"borderWidth10"}
            borderBottomColor={"colorBorderInverse"}
            borderBottomStyle={"solid"}
        >
            <Box flex={1}>
                <Box
                    as="span"
                    color={"colorTextInverse"}
                    margin={"space0"}
                    fontSize={"fontSize40"}
                    fontWeight={"fontWeightBold"}
                    paddingLeft="space20"
                >
                    {reservation && getTaskName(reservation?.task.attributes)}
                </Box>
                {reservation && (
                    <TaskListItemContent
                        callTime={reservation?.task.dateCreated}
                        taskContent={conversationUser ? (isOnline ? "Online" : "Offline") : reservation?.status}
                    />
                )}
            </Box>

            {reservation?.status === "accepted" && (
                <>
                    <Box marginLeft={"space30"}>
                        <Button
                            variant="primary"
                            onClick={() => {
                                client.execute(new EndTask(reservation.task.sid));
                            }}
                        >
                            End
                        </Button>
                    </Box>
                    {reservation.task.taskChannelUniqueName !== "voice" && (
                        <>
                            <Box marginLeft={"space30"}>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        client.execute(new PauseConversation(reservation.task.sid));
                                    }}
                                >
                                    Pause
                                </Button>
                            </Box>
                            <Box marginLeft={"space30"}>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        client.execute(new LeaveConversation(reservation.task.sid));
                                    }}
                                >
                                    Leave
                                </Button>
                            </Box>
                            <Box marginLeft={"space30"}>
                                <TransferModal
                                    client={client}
                                    onSelect={(targetSid) => {
                                        return client.execute(
                                            new StartConversationTransfer(reservation.task.sid, targetSid)
                                        );
                                    }}
                                />
                            </Box>
                        </>
                    )}
                </>
            )}

            {reservation?.status === "wrapping" && (
                <Box marginLeft={"space30"}>
                    <Button
                        variant="primary"
                        onClick={() => {
                            client.execute(new CompleteTask(reservation.task.sid));
                        }}
                    >
                        Complete
                    </Button>
                </Box>
            )}
        </Box>
    );
}
