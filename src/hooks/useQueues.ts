import { useState } from "react";
import { Client } from "@twilio/flex-sdk";
import { TaskRouterTaskQueue } from "@twilio/flex-sdk/taskrouter";

export const useQueues = (client: Client) => {
    const [queues, setQueues] = useState<TaskRouterTaskQueue[]>([]);

    const fetch = async () => {
        const workspace = await client.getWorkspace();
        workspace.fetchTaskQueues().then((queues) => {
            setQueues(Array.from(queues.values()));
        });
    };

    return { queues, refetchQueues: fetch };
};
