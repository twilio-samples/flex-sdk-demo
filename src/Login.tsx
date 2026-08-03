import { Button, Box, Alert, Label, Input, Heading, Text } from "@twilio-paste/core";
import { Theme } from "@twilio-paste/theme";
import { LogoTwilioIcon } from "@twilio-paste/icons/esm/LogoTwilioIcon";
import React, { FormEvent, useEffect, useState } from "react";
import { getLoginDetails, getAuthenticationConfig } from "@twilio/flex-sdk";
import { useLocalStorage } from "./hooks/useLocalStorage";

const HEADING_ID = "runtime-domain-heading";

const Login = () => {
    const [error, setError] = useState<string | null>();
    const [runtimeDomain, setRuntimeDomain] = useState(localStorage.getItem("runtimeDomain") || "");
    const { setData, removeData } = useLocalStorage();

    useEffect(() => {
        removeData("jweToken");
    }, []);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        try {
            localStorage.setItem("runtimeDomain", runtimeDomain);
            const authConfig = await getAuthenticationConfig({ runtimeDomain });
            const activeConfig = authConfig.configList.find((config) => config.active);
            if (!activeConfig) {
                setError("No active auth config found");
                return;
            }
            setData("auth-config", activeConfig);
            const response = await getLoginDetails({
                ssoProfileSid: activeConfig.connectionName,
                clientId: activeConfig.clientId,
                redirectUrl: `${window.location.origin}/agentDesktop`
            });
            setData("login-details", response);
            window.location.href = response.loginUrl;
        } catch (error) {
            setError("Error while fetching auth config");
            console.error("Error while fetching auth config", error);
        }
    };

    return (
        <Theme.Provider theme="dark">
            <Box
                backgroundColor="colorBackgroundBody"
                alignItems="center"
                justifyContent="center"
                display="flex"
                height="100vh"
                paddingX="space60"
            >
                <Box
                    as="form"
                    aria-labelledby={HEADING_ID}
                    onSubmit={(e: FormEvent<HTMLFormElement>) => handleLogin(e)}
                    width="100%"
                    maxWidth="400px"
                    display="flex"
                    flexDirection="column"
                    rowGap="space60"
                    padding="space90"
                    borderWidth="borderWidth10"
                    borderStyle="solid"
                    borderColor="colorBorderWeaker"
                    borderRadius="borderRadius30"
                    backgroundColor="colorBackground"
                >
                    <Box display="flex" flexDirection="column" alignItems="center" rowGap="space40">
                        <LogoTwilioIcon decorative={false} title="Twilio" color="colorTextError" size="sizeIcon110" />
                        <Heading as="h1" variant="heading20" marginBottom="space0">
                            Flex SDK Demo
                        </Heading>
                        <Text as="p" fontSize="fontSize30" color="colorTextWeak" textAlign="center">
                            Sign in to your Flex workspace to continue.
                        </Text>
                    </Box>

                    <Box display="flex" flexDirection="column" rowGap="space20">
                        <Label htmlFor="runtime-domain">Runtime domain</Label>
                        <Input
                            type="text"
                            id="runtime-domain"
                            name="runtime-domain"
                            value={runtimeDomain}
                            onChange={(e) => setRuntimeDomain(e.target.value)}
                            placeholder="Enter your runtime domain"
                        />
                    </Box>

                    <Button variant="primary" type="submit" fullWidth disabled={!runtimeDomain.trim()}>
                        Submit
                    </Button>

                    {error && (
                        <Alert variant="error">
                            <strong>Error:</strong> {error}
                        </Alert>
                    )}
                </Box>
            </Box>
        </Theme.Provider>
    );
};

export default Login;
