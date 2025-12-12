import { useSdkClient } from "./hooks/useSdkClient";
import { MainLayout } from "./components/MainLayout";
import { AgentDesktopView } from "./views/AgentDesktopView";
import { SupervisorView } from "./views/SupervisorView";
import { Box, Spinner, Text } from "@twilio-paste/core";
import { useState } from "react";

export function AppWrapper() {
    const { sdkClient, voiceCall, worker } = useSdkClient();
    const [activeView, setActiveView] = useState<"agent" | "supervisor">("agent");

    if (!sdkClient) {
        return (
            <Box
                flex={1}
                display="flex"
                flexDirection={"column"}
                justifyContent="center"
                alignItems="center"
                height={"100vh"}
                backgroundColor={"colorBackgroundBodyInverse"}
            >
                <Spinner decorative={false} title="Loading" color={"colorTextBrandInverse"} size="sizeIcon80" />
                <Text as="span" color="colorTextBrandInverse" marginTop={"space30"}>
                    Please wait while we are initializing...
                </Text>
            </Box>
        );
    }

    return (
        <MainLayout sdkClient={sdkClient} worker={worker} activeView={activeView} onViewChange={setActiveView}>
            {activeView === "agent" && (
                <AgentDesktopView sdkClient={sdkClient} voiceCall={voiceCall} worker={worker} />
            )}
            {activeView === "supervisor" && <SupervisorView sdkClient={sdkClient} worker={worker} />}
        </MainLayout>
    );
}
