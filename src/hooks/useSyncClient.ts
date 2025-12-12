import { useEffect, useState } from "react";
import { Client as SyncClient } from "twilio-sync";
import { Client } from "@twilio/flex-sdk";

export function useSyncClient(sdkClient: Client | null) {
    const [syncClient, setSyncClient] = useState<SyncClient | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!sdkClient) return;

        const initSync = async () => {
            try {
                const client = new SyncClient(sdkClient.token, {
                    productId: "flex_insights",
                    clientMetadata: {
                        type: "flex_sdk_demo",
                        app: "Flex SDK Demo"
                    }
                });

                client.on("connectionStateChanged", (state) => {
                    console.log("Sync connection state:", state);
                    if (state === "connected") {
                        setIsReady(true);
                    }
                });

                setSyncClient(client);
            } catch (error) {
                console.error("Failed to initialize Sync client:", error);
            }
        };

        initSync();

        return () => {
            if (syncClient) {
                syncClient.shutdown();
            }
        };
    }, [sdkClient]);

    return { syncClient, isReady };
}
