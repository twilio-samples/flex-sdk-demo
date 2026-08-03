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
import { CustomizationProvider } from "@twilio-paste/core/customization";
import { ChevronDownIcon } from "@twilio-paste/icons/esm/ChevronDownIcon";
import { LogOutIcon } from "@twilio-paste/icons/esm/LogOutIcon";
import { Worker } from "@twilio/flex-sdk/taskrouter";
import { DROPDOWN_MENU_ELEMENT, PILL_TRIGGER_PROPS } from "./ui/dropdownStyles";

export interface UserProfileDropdownProps {
    worker?: Worker | null;
    onLogoutClick: () => void;
}

export function UserProfileDropdown({ worker, onLogoutClick }: UserProfileDropdownProps) {
    const popover = usePopoverState({});

    const attributes = worker?.attributes || {};
    const workerName = attributes.full_name || attributes.friendly_name || worker?.name;
    const email = typeof attributes.email === "string" ? attributes.email : undefined;

    const handleLogout = useCallback(() => {
        popover.hide();
        onLogoutClick();
    }, [popover, onLogoutClick]);

    if (!workerName) {
        return (
            <Box display="flex" alignItems="center" padding="space30">
                <Avatar size="sizeIcon40" name="Loading" />
                <Text as="span" color="colorText" marginLeft="space20">
                    Loading...
                </Text>
            </Box>
        );
    }

    return (
        <CustomizationProvider baseTheme="dark" elements={{ PROFILE_MENU: DROPDOWN_MENU_ELEMENT }}>
            <Box>
                <PopoverContainer state={popover}>
                    <PopoverButton variant="reset">
                        <Box {...PILL_TRIGGER_PROPS} paddingX="space40">
                            <Avatar size="sizeIcon40" name={workerName} />
                            <Text as="span" color="colorText" fontSize="fontSize30" fontWeight="fontWeightSemibold">
                                {workerName}
                            </Text>
                            <ChevronDownIcon decorative color="colorTextWeak" size="sizeIcon20" />
                        </Box>
                    </PopoverButton>
                    <Popover aria-label="User Profile Menu" element="PROFILE_MENU">
                        <Box padding="space50" minWidth="260px">
                            <Box display="flex" alignItems="center" columnGap="space40">
                                <Avatar size="sizeIcon80" name={workerName} />
                                <Box display="flex" flexDirection="column">
                                    <Text
                                        as="span"
                                        fontSize="fontSize50"
                                        fontWeight="fontWeightSemibold"
                                        lineHeight="lineHeight40"
                                    >
                                        {workerName}
                                    </Text>
                                    {email && (
                                        <Text as="span" fontSize="fontSize30" color="colorTextWeak">
                                            {email}
                                        </Text>
                                    )}
                                </Box>
                            </Box>

                            <Separator orientation="horizontal" verticalSpacing="space40" />

                            <Button variant="reset" size="reset" fullWidth onClick={handleLogout}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    columnGap="space30"
                                    width="100%"
                                    paddingX="space40"
                                    paddingY="space30"
                                    borderRadius="borderRadius20"
                                    _hover={{ backgroundColor: "colorBackgroundStronger" }}
                                >
                                    <LogOutIcon decorative color="colorTextError" size="sizeIcon30" />
                                    <Text as="span" color="colorTextError" fontWeight="fontWeightSemibold">
                                        Logout
                                    </Text>
                                </Box>
                            </Button>
                        </Box>
                    </Popover>
                </PopoverContainer>
            </Box>
        </CustomizationProvider>
    );
}
