import { Button, Box, Alert, Label, Input } from "@twilio-paste/core";
import React, { FormEvent, useEffect, useState } from "react";
import { getLoginDetails, getAuthenticationConfig } from "@twilio/flex-sdk";
import { useLocalStorage } from "./hooks/useLocalStorage";
import twilioLogo from "./assets/logo-twilio.png";

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
            }
            setData("auth-config", activeConfig);
            const response = await getLoginDetails({
                ssoProfileSid: authConfig.configList[0].ssoProfileSid,
                clientId: authConfig.configList[0].clientId,
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
        <Box
            backgroundColor={"colorBackgroundBodyInverse"}
            alignItems={"center"}
            justifyContent={"center"}
            display="flex"
            flexDirection="column"
            height="100vh"
        >
            <form
                aria-labelledby={"runtime-domain-heading"}
                onSubmit={(e: FormEvent<HTMLFormElement>) => handleLogin(e)}
            >
                <Box as="h2" id={"address-heading"} color={"colorTextBrandInverse"} textAlign={"center"}>
                    <Box display="flex" alignItems="center" justifyContent="center">
                        <img src={twilioLogo} alt="Twilio Logo" style={{ height: "180px" }} />
                    </Box>
                    Flex SDK Demo
                </Box>
                <Box marginBottom={"space60"}>
                    <Label htmlFor={"runtime-domain"} variant="inverse">
                        Enter Runtime Domain
                    </Label>
                    <Input
                        type="text"
                        id={"runtime-domain"}
                        name="friendly-name"
                        value={runtimeDomain}
                        onChange={(e) => setRuntimeDomain(e.target.value)}
                        placeholder="Enter your runtime domain"
                    />
                </Box>
                <Button variant="primary" type="submit" fullWidth>
                    Submit
                </Button>
                {error && (
                    <Box marginBottom="space40" marginTop="space40">
                        <Alert variant="error">
                            <strong>Error:</strong> {error}
                        </Alert>
                    </Box>
                )}
            </form>
        </Box>
    );
};

export default Login;
