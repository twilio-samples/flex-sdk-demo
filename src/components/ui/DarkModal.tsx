import type { ComponentProps, ReactNode } from "react";
import { CustomizationProvider } from "@twilio-paste/core/customization";

type CustomizationElements = ComponentProps<typeof CustomizationProvider>["elements"];

export interface DarkModalProps {
    children: ReactNode;
    /** Padding applied to the modal header/body/footer. */
    padding?: "space70" | "space80";
    /** Extra element overrides merged on top of the shared modal styling. */
    elements?: CustomizationElements;
}

/**
 * Shared dark-themed CustomizationProvider for modals, so the header/body/footer
 * padding and radius stay consistent across every modal in the app.
 */
export function DarkModal({ children, padding = "space70", elements }: DarkModalProps) {
    return (
        <CustomizationProvider
            baseTheme="dark"
            elements={{
                MODAL: { borderRadius: "borderRadius30" },
                MODAL_HEADER: { padding },
                MODAL_BODY: { padding },
                MODAL_FOOTER: { padding },
                MODAL_HEADING: { fontSize: "fontSize70", lineHeight: "lineHeight70" },
                ...elements
            }}
        >
            {children}
        </CustomizationProvider>
    );
}
