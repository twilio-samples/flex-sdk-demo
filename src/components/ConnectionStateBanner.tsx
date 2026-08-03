import { Alert, Box, Text } from "@twilio-paste/core";
import type { SdkConnectionState } from "@twilio/flex-sdk";

interface ConnectionStateBannerProps {
    connectionState: SdkConnectionState;
}

export function ConnectionStateBanner({ connectionState }: ConnectionStateBannerProps) {
    const { overall } = connectionState;

    if (overall === "connected" || overall === "notInitialized") {
        return null;
    }

    const isConnecting = overall === "connecting";

    return (
        <Box position="sticky" top="0" zIndex="zIndex10">
            <Alert variant={isConnecting ? "warning" : "error"} onDismiss={undefined}>
                <Box display="flex" columnGap="space20" alignItems="center">
                    <Text as="span" fontWeight="fontWeightSemibold">
                        {isConnecting ? "Reconnecting…" : "Disconnected"}
                    </Text>
                    <Text as="span">
                        {isConnecting
                            ? "Your connection was interrupted. Attempting to reconnect."
                            : "Connection lost. Please check your network."}
                    </Text>
                    {connectionState.network === "disconnected" && (
                        <Text as="span" color="colorTextWeak">
                            (Network offline)
                        </Text>
                    )}
                </Box>
            </Alert>
        </Box>
    );
}
