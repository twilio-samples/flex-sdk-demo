import { useEffect, useState } from "react";
import { Client, Conversation, GetConversationByTask, Reservation } from "@twilio/flex-sdk";

export const useLastMessages = (client: Client, reservations: Reservation[]) => {
    const [conversationsMap, setConversationsMap] = useState<
        Map<string, { conversation: Conversation; lastMessage: string | null }>
    >(new Map());

    useEffect(() => {
        const conversationReservations = reservations.filter(
            (reservation) => reservation.task.taskChannelUniqueName !== "voice"
        );

        conversationReservations.forEach((res) => {
            if (!conversationsMap.has(res.task.sid)) {
                client.execute(new GetConversationByTask(res.task.sid)).then(async (conversation) => {
                    const lastMessage = (await conversation.getMessages(1)).items?.[0]?.body;
                    setConversationsMap((prevMap) => {
                        const newMap = new Map(prevMap);
                        newMap.set(res.task.sid, { conversation, lastMessage });
                        return newMap;
                    });

                    conversation.conversation.on("messageAdded", (message) => {
                        setConversationsMap((prevMap) => {
                            const newMap = new Map(prevMap);
                            newMap.set(res.task.sid, {
                                conversation,
                                lastMessage: message.body
                            });
                            return newMap;
                        });
                    });
                });
            }
        });
    }, [reservations]);

    return conversationsMap;
};
