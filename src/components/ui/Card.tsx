import type { ReactNode } from "react";
import { Box, type BoxProps } from "@twilio-paste/core";

export type CardProps = BoxProps & { children?: ReactNode };

/**
 * Bordered surface used across the app's panels and list items. Defaults match
 * the common "card" recipe; any prop can be overridden (padding, borderWidth,
 * rowGap, style, …) by the caller.
 */
export function Card({ children, ...props }: CardProps) {
    return (
        <Box
            padding="space60"
            borderWidth="borderWidth20"
            borderStyle="solid"
            borderColor="colorBorderWeaker"
            borderRadius="borderRadius30"
            backgroundColor="colorBackground"
            display="flex"
            flexDirection="column"
            {...props}
        >
            {children}
        </Box>
    );
}
