import { useState } from "react";
import { Client, GetPausedConversations, PausedConversation } from "@twilio/flex-sdk";

export const usePausedConversations = (client: Client) => {
    const [pausedConversations, setPausedConversations] = useState<PausedConversation[]>([]);

    const fetch = async () => {
        client.execute(new GetPausedConversations()).then((pausedConversations) => {
            setPausedConversations(pausedConversations.items);
        });
    };

    return { pausedConversations, refetch: fetch };
};
