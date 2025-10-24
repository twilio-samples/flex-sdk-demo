import { useState } from "react";
import { Client } from "@twilio/flex-sdk";
import { WorkerInfo } from "@twilio/flex-sdk/taskrouter";

export const useWorkersInfo = (client: Client) => {
    const [workers, setWorkers] = useState<WorkerInfo[]>([]);

    const fetch = async () => {
        const workspace = await client.getWorkspace();
        workspace.fetchWorkersInfo().then((workers) => {
            console.error("Workers", workers);
            setWorkers(Array.from(workers.values()));
        });
    };

    return { workers, refetchWorkers: fetch };
};
