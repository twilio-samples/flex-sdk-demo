import { useState, useEffect } from "react";
import {
    AddVoiceEventListener,
    AuthenticationConfig,
    Client,
    createClient,
    LoginDetailsResponse,
    VoiceCall,
    VoiceClientEvent,
    exchangeToken,
    SessionOptions
} from "@twilio/flex-sdk";
import { Worker } from "@twilio/flex-sdk/taskrouter";
import { useLocation } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";
import { initReservationListener } from "../state/listener";

export interface useSdkClientReturn {
    sdkClient: Client | undefined;
    worker: Worker | null | undefined;
    token: string | null | undefined;
    voiceCall: VoiceCall | undefined;
}

export const useSdkClient = (): useSdkClientReturn => {
    const { getData, removeData, setData } = useLocalStorage();
    const [sdkClient, setSdkClient] = useState<Client | undefined>(undefined);
    const [worker, setWorkerObj] = useState<Worker | null>(null);
    const [jweToken, setJweToken] = useState<string | null | undefined>(getData("jweToken"));
    const [voiceCall, setVoiceVoiceCall] = useState<VoiceCall>();

    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const authCode = searchParams.get("code");
        const state = searchParams.get("state");

        const authConfig = getData<AuthenticationConfig>("auth-config");
        if (authCode && state && authConfig) {
            const exchangeTokenHandler = async () => {
                const codeVerifier = getData<LoginDetailsResponse>("login-details")?.codeVerifier;
                const nonce = getData<LoginDetailsResponse>("login-details")?.nonce;
                if (!codeVerifier || !nonce) {
                    return;
                }
                const tokenResponse = await exchangeToken({
                    ssoProfileSid: authConfig.connectionName,
                    codeVerifier,
                    nonce,
                    code: authCode
                });
                removeData("auth-config");
                removeData("login-details");
                setData("jweToken", tokenResponse?.accessToken);
                setData("refreshToken", tokenResponse?.refreshToken);
                setJweToken(tokenResponse?.accessToken);
                window.history.replaceState({}, document.title, "/agentDesktop");
            };
            exchangeTokenHandler();
        }
    }, []);

    useEffect(() => {
        if (!jweToken) return;

        const initializeSdkClient = async () => {
            try {
                const authConfig = getData<AuthenticationConfig>("auth-config");
                const refreshToken = getData<string>("refreshToken");
                let sessionOptions: SessionOptions = {
                    autoUpdateToken: false
                };
                if (authConfig?.ssoProfileSid && refreshToken) {
                    sessionOptions = {
                        refreshToken,
                        ssoProfileSid: authConfig.ssoProfileSid,
                        autoUpdateToken: true,
                        isConsoleLogin: false
                    };
                }

                const client = await createClient(jweToken, {
                    logger: { level: "debug" },
                    voiceOptions: { autoAcceptIncomingCalls: true },
                    session: sessionOptions
                });
                const worker = await client.getWorker();
                setWorkerObj(worker);

                initReservationListener(client, worker);

                worker.setMaxListeners(100);
                client.addListener("tokenUpdated", (tokenPayload: string) => {
                    setData("jweToken", tokenPayload);
                });

                client.execute(
                    new AddVoiceEventListener(VoiceClientEvent.Incoming, (call: unknown) => {
                        setVoiceVoiceCall(call as VoiceCall);
                    })
                );

                setSdkClient(client);
            } catch (error) {
                console.error("Failed to initialize SDK Client and Worker", error);
                window.location.replace("/");
            }
        };

        initializeSdkClient();
    }, [jweToken]);

    return { sdkClient, worker, token: jweToken, voiceCall };
};
