import { useState, useCallback } from "react";
import { Box, Button, Input, Label, Text, Alert, Spinner, Stack } from "@twilio-paste/core";
import { CallIcon } from "@twilio-paste/icons/esm/CallIcon";
import { Client } from "@twilio/flex-sdk/actions/Conversation";
import { StartOutboundCall, VoiceCall } from "@twilio/flex-sdk/actions/Voice";

export interface OutboundDialerProps {
    client: Client;
    startOutboundCallOptions?: {
        conferenceOptions?: {
            endConferenceOnExit?: boolean;
            endConferenceOnCustomerExit?: boolean;
        };
        fromNumber?: string;
        workflowSid?: string;
        taskQueueSid?: string;
    };
    onCallCreated?: (call: VoiceCall) => void;
}

export function OutboundDialer({ client, startOutboundCallOptions = {}, onCallCreated }: OutboundDialerProps) {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isDialing, setIsDialing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dialPadButtons = [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["*", "0", "#"]
    ];

    const handleNumberInput = useCallback((digit: string) => {
        setPhoneNumber((prev) => prev + digit);
        setError(null);
    }, []);

    const handlePhoneNumberChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPhoneNumber(event.target.value);
        setError(null);
    }, []);

    const validatePhoneNumber = (number: string): boolean => {
        const cleanNumber = number.replace(/\D/g, "");
        return number.startsWith("+") && cleanNumber.length >= 10;
    };

    const handleStartCall = useCallback(async () => {
        if (!phoneNumber.trim()) {
            setError("Please enter a phone number");
            return;
        }

        if (!validatePhoneNumber(phoneNumber)) {
            setError("Please enter a valid phone number (at least 10 digits) starting with + and country code");
            return;
        }

        setIsDialing(true);
        setError(null);

        try {
            const formattedNumber = "+" + phoneNumber.replace(/\D/g, "");

            const startOutboundCall = new StartOutboundCall(formattedNumber, {
                ...startOutboundCallOptions,
                conferenceOptions: {
                    endConferenceOnExit: true,
                    endConferenceOnCustomerExit: true,
                    ...startOutboundCallOptions.conferenceOptions
                }
            });

            const call = await client.execute(startOutboundCall);

            setPhoneNumber("");
            onCallCreated?.(call);
        } catch (err) {
            console.error("Failed to start outbound call:", err);
            setError(err instanceof Error ? err.message : "Failed to start call. Please try again.");
        } finally {
            setIsDialing(false);
        }
    }, [client, phoneNumber, startOutboundCallOptions, onCallCreated]);

    const handleKeyPress = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "Enter") {
                handleStartCall();
            }
        },
        [handleStartCall]
    );

    return (
        <Box padding="space60" backgroundColor={"colorBackgroundBody"} width="100%" maxWidth="320px">
            <Stack orientation="vertical" spacing="space50">
                <Box>
                    <Label htmlFor="phone-input" required>
                        <Text as="span" color={"colorText"} fontSize="fontSize30" fontWeight="fontWeightMedium">
                            Phone Number
                        </Text>
                    </Label>
                    <Input
                        id="phone-input"
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        onKeyDown={handleKeyPress}
                        placeholder="+1-555-123-4567"
                        disabled={isDialing}
                        hasError={!!error}
                        variant={"default"}
                    />
                </Box>

                {error && (
                    <Alert variant="error">
                        <Text as="span">{error}</Text>
                    </Alert>
                )}

                <Box>
                    <Text
                        as="span"
                        color={"colorText"}
                        fontSize="fontSize30"
                        fontWeight="fontWeightMedium"
                        marginBottom="space30"
                        display="block"
                    >
                        Dial Pad
                    </Text>
                    <Box display="grid" rowGap="space20" columnGap="space20" gridTemplateColumns="repeat(3, 1fr)">
                        {dialPadButtons.flat().map((digit) => (
                            <Button
                                key={digit}
                                variant={"secondary"}
                                size="default"
                                fullWidth
                                onClick={() => handleNumberInput(digit)}
                                disabled={isDialing}
                            >
                                {digit}
                            </Button>
                        ))}
                    </Box>
                </Box>

                <Box display="flex" justifyContent="center" marginTop="space40">
                    <Button
                        variant="primary"
                        size="default"
                        onClick={handleStartCall}
                        disabled={isDialing || !phoneNumber}
                        loading={isDialing}
                    >
                        {isDialing ? (
                            <>
                                <Spinner decorative size="sizeIcon20" />
                                Dialing...
                            </>
                        ) : (
                            <>
                                <CallIcon decorative />
                                Call
                            </>
                        )}
                    </Button>
                </Box>

                <Box marginTop="space30">
                    <Text as="p" color={"colorTextWeak"} fontSize="fontSize20" textAlign="center">
                        Type a phone number or use the dial pad, then click Call to start an outbound call
                    </Text>
                </Box>
            </Stack>
        </Box>
    );
}
