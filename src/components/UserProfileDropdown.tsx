import { useCallback } from "react";
import {
    Box,
    Button,
    Text,
    Avatar,
    PopoverContainer,
    Popover,
    PopoverButton,
    usePopoverState,
    Separator
} from "@twilio-paste/core";
import { ChevronDownIcon } from "@twilio-paste/icons/esm/ChevronDownIcon";
import { LogOutIcon } from "@twilio-paste/icons/esm/LogOutIcon";
import { Worker } from "@twilio/flex-sdk/taskrouter";
import { Theme } from "@twilio-paste/theme";

interface UserProfileDropdownProps {
    worker?: Worker | null;
    onLogoutClick: () => void;
    darkMode?: boolean;
}

export function UserProfileDropdown({ worker, onLogoutClick }: UserProfileDropdownProps) {
    const popover = usePopoverState();

    const attributes = worker?.attributes || {};
    const workerName = attributes.full_name || attributes.friendly_name || worker?.name;

    const handleLogout = useCallback(() => {
        popover.hide();
        onLogoutClick();
    }, [popover, onLogoutClick]);

    if (!workerName) {
        return (
            <Box display="flex" alignItems="center" padding="space30">
                <Avatar size="sizeIcon40" name="Loading" />
                <Text as="span" color={"colorTextInverse"} marginLeft="space20">
                    Loading...
                </Text>
            </Box>
        );
    }

    return (
        <Box>
            <PopoverContainer state={popover}>
                <Theme.Provider theme="dark">
                    <PopoverButton variant={"reset"}>
                        <Box display="flex" alignItems="center">
                            <Avatar size="sizeIcon40" name={workerName} />
                            <Box marginLeft="space20" marginRight="space20">
                                <Text as="span" color={"colorTextInverse"} fontSize="fontSize30">
                                    {workerName}
                                </Text>
                            </Box>
                            <ChevronDownIcon decorative color={"colorTextInverse"} size="sizeIcon20" />
                        </Box>
                    </PopoverButton>
                    <Popover aria-label="User Profile Menu">
                        <Box padding="space50" minWidth="250px">
                            {/* User Profile Section */}
                            <Box display="flex" alignItems="center" marginBottom="space40">
                                <Avatar size="sizeIcon70" name={workerName} />
                                <Box marginLeft="space40">
                                    <Text
                                        as="p"
                                        fontSize="fontSize40"
                                        fontWeight="fontWeightMedium"
                                        lineHeight="lineHeight40"
                                    >
                                        {workerName}
                                    </Text>
                                </Box>
                            </Box>

                            <Separator orientation="horizontal" />

                            {/* Actions Section */}
                            <Box marginTop="space40">
                                <Button variant="destructive_link" size="small" onClick={handleLogout} fullWidth>
                                    <Box display="flex" alignItems="center" justifyContent="center">
                                        <LogOutIcon decorative size="sizeIcon20" />
                                        <Text as="span" marginLeft="space20">
                                            Logout
                                        </Text>
                                    </Box>
                                </Button>
                            </Box>
                        </Box>
                    </Popover>
                </Theme.Provider>
            </PopoverContainer>
        </Box>
    );
}
