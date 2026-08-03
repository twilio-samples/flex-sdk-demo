import type { BoxProps } from "@twilio-paste/core";

/** Element styling shared by the header dropdown menus (profile, activity). */
export const DROPDOWN_MENU_ELEMENT = {
    backgroundColor: "colorBackgroundStrong",
    borderRadius: "borderRadius30",
    borderStyle: "solid",
    borderWidth: "borderWidth10",
    borderColor: "colorBorderWeaker"
} as const;

/** Pill-shaped trigger button styling shared by the header dropdowns. */
export const PILL_TRIGGER_PROPS: BoxProps = {
    display: "flex",
    alignItems: "center",
    columnGap: "space30",
    height: "44px",
    borderRadius: "borderRadiusPill",
    borderWidth: "borderWidth10",
    borderStyle: "solid",
    borderColor: "colorBorderWeaker",
    backgroundColor: "colorBackground",
    _hover: { backgroundColor: "colorBackgroundStrong" }
};
