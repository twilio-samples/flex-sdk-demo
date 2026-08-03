import { LogoTwilioIcon } from "@twilio-paste/icons/esm/LogoTwilioIcon";
import { Box, Text } from "@twilio-paste/core";
import { Theme } from "@twilio-paste/theme";
import { Client } from "@twilio/flex-sdk/actions/Conversation";
import { Worker } from "@twilio/flex-sdk/taskrouter";
import { ActivitySelectorDropdown } from "./ActivitySelectorDropdown";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { OutboundDialerModal } from "./OutboundDialerModal";
import { SupervisorActions } from "./SupervisorActions";
import { MonitoredCall } from "./MonitoredCallPanel";

export interface HeaderProps {
    client: Client;
    worker?: Worker | null | undefined;
    onMonitorStarted: (monitored: MonitoredCall) => void;
}

export function Header({ client, worker, onMonitorStarted }: HeaderProps) {
    return (
        <Theme.Provider theme="dark">
            <Box
                as="header"
                display="flex"
                alignItems="center"
                columnGap="space50"
                paddingX="space70"
                height="80px"
                backgroundColor="colorBackgroundBody"
                borderBottomWidth="borderWidth10"
                borderBottomStyle="solid"
                borderBottomColor="colorBorderWeaker"
            >
                <LogoTwilioIcon decorative={false} title="Twilio" color="colorTextError" size="sizeIcon90" />
                <Text as="span" fontSize="fontSize70" fontWeight="fontWeightBold" color="colorText">
                    Flex SDK Demo
                </Text>

                {/* spacer pushes controls to the right */}
                <Box flex={1} />

                <SupervisorActions client={client} worker={worker} onMonitorStarted={onMonitorStarted} />

                <OutboundDialerModal client={client} />

                <Box marginLeft="space30" marginRight="space30">
                    <ActivitySelectorDropdown client={client} worker={worker} />
                </Box>

                <UserProfileDropdown
                    worker={worker}
                    onLogoutClick={() => {
                        client.destroy();
                        window.location.replace("/");
                    }}
                />
            </Box>
        </Theme.Provider>
    );
}
