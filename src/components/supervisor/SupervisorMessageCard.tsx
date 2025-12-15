import React from "react";
import { LiveReservation } from "../../hooks/useWorkerTasks";
import { Box, Text } from "@twilio-paste/core";
import { SMSCapableIcon } from "@twilio-paste/icons/esm/SMSCapableIcon";

export interface Props {
    client: any;
    reservation?: LiveReservation;
    isSelected?: boolean;
    onSelect?: () => void;
}

export const SupervisorMessageCard = ({ reservation, isSelected = false, onSelect }: Props) => {

    if (!reservation) {
        return (
            <Box
                borderRadius="borderRadius20"
                borderStyle="solid"
                borderWidth="borderWidth10"
                borderColor="colorBorderWeak"
                minWidth="280px"
                height="60px"
                position="relative"
                overflow="hidden"
                style={{
                    backgroundImage: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 10px,
                        rgba(136, 145, 170, 0.1) 10px,
                        rgba(136, 145, 170, 0.1) 20px
                    )`
                }}
            />
        );
    }

    const address = reservation.attributes?.customerAddress || "Unknown";
    const queueName = reservation.queue_name || "N/A";
    const status = reservation.status;

    return (
        <Box
            display="flex"
            alignItems="center"
            padding="space30"
            backgroundColor="colorBackgroundBody"
            borderRadius="borderRadius20"
            borderStyle="solid"
            borderWidth="borderWidth20"
            borderColor={isSelected ? "colorBorderPrimary" : "colorBorderWeak"}
            columnGap="space30"
            width="100%"
            onClick={onSelect}
            _hover={{
                borderColor: isSelected ? "colorBorderPrimary" : "colorBorder",
                cursor: "pointer"
            }}
            transition="border-color 150ms ease-in-out"
        >
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                backgroundColor="colorBackgroundPrimaryWeakest"
                borderRadius="borderRadiusCircle"
                padding="space30"
                flexShrink={0}
            >
                <SMSCapableIcon decorative size="sizeIcon40" color="colorTextIconAvailable" />
            </Box>
            
            <Box display="flex" flexDirection="column" minWidth="0" flex="1">
                <Text
                    as="div"
                    fontSize="fontSize30"
                    fontWeight="fontWeightBold"
                    lineHeight="lineHeight30"
                    color="colorText"
                >
                    {address}
                </Text>
                <Text
                    as="div"
                    fontSize="fontSize20"
                    lineHeight="lineHeight20"
                    color="colorTextWeak"
                >
                    {status} | {queueName}
                </Text>
            </Box>
        </Box>
    );
}
