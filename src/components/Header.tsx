import { LogoTwilioIcon } from "@twilio-paste/icons/esm/LogoTwilioIcon";
import { Box } from "@twilio-paste/core";
import { Client } from "@twilio/flex-sdk/actions/Conversation";
import { Worker } from "@twilio/flex-sdk/taskrouter";
import { ActivitySelectorDropdown } from "./ActivitySelectorDropdown";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { OutboundDialerModal } from "./OutboundDialerModal";

export function Header({ client, worker }: { client: Client; worker?: Worker | null | undefined }) {
    return (
        <Box
            padding="space60"
            color={"colorTextInverse"}
            backgroundColor="colorBackgroundBodyInverse"
            display={"flex"}
            alignItems={"center"}
        >
            <Box>
                <LogoTwilioIcon
                    decorative={false}
                    title="Description of icon"
                    color="colorTextError"
                    size={"sizeIcon100"}
                />
            </Box>
            <Box
                as="h1"
                color={"colorTextInverse"}
                margin={"space0"}
                marginLeft={"space60"}
                flex={1}
                textAlign={"start"}
            >
                Flex SDK Demo
            </Box>

            <Box marginLeft={"space30"} marginRight={"space30"}>
                <OutboundDialerModal client={client} />
            </Box>

            <Box color={"colorText"}>
                <ActivitySelectorDropdown client={client} worker={worker} />
            </Box>
            <Box marginRight={"space30"} marginLeft={"space30"}>
                <UserProfileDropdown
                    worker={worker}
                    onLogoutClick={() => {
                        client.destroy();
                        window.location.replace("/");
                    }}
                />
            </Box>
        </Box>
    );
}
