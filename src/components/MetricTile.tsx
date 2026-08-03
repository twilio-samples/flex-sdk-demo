import { Text } from "@twilio-paste/core";
import { Card } from "./ui/Card";

export interface MetricTileProps {
    label: string;
    value: string | number;
    caption: string;
    alert?: boolean;
}

/**
 * A KPI tile: uppercase label, large value, caption, on a weak (subtle) surface.
 */
export function MetricTile({ label, value, caption, alert = false }: MetricTileProps) {
    return (
        <Card rowGap="space30" style={{ fontFamily: "var(--font-mono)" }}>
            <Text
                as="span"
                fontSize="fontSize20"
                fontWeight="fontWeightSemibold"
                color="colorTextWeak"
                textTransform="uppercase"
            >
                {label}
            </Text>
            <Text
                as="span"
                fontSize="fontSize100"
                lineHeight="lineHeight70"
                fontWeight="fontWeightBold"
                color={alert ? "colorTextError" : "colorText"}
                style={{ fontFamily: "var(--font-buffalo)" }}
            >
                {value}
            </Text>
            <Text as="span" fontSize="fontSize20" color="colorTextWeak">
                {caption}
            </Text>
        </Card>
    );
}
