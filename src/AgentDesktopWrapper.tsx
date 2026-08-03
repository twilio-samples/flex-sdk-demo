import { useSdkClient } from "./hooks/useSdkClient";
import { AgentDesktop } from "./AgentDesktop";
import { Box, Spinner, Text } from "@twilio-paste/core";

export function AgentDesktopWrapper() {
    const { sdkClient, voiceCall, worker, dataClient, connectionState } = useSdkClient();

    if (!sdkClient || !dataClient) {
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
                    Please wait while we are initializing the agent desktop...
                </Text>
            </Box>
        );
    }

    return <AgentDesktop sdkClient={sdkClient} voiceCall={voiceCall} worker={worker} dataClient={dataClient} connectionState={connectionState} />;
}
