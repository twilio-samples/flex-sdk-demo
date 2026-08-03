import { useState, useEffect } from "react";
import {
    AddVoiceEventListener,
    AuthenticationConfig,
    Client,
    ClientEvent,
    createClient,
    InitializeDataClient,
    LoginDetailsResponse,
    SdkConnectionState,
    VoiceCall,
    VoiceClientEvent,
    exchangeToken,
    refreshToken,
    validateToken,
    SessionOptions
} from "@twilio/flex-sdk";
import type { FlexDataClient } from "@twilio/flex-sdk/data-client";
import { Worker } from "@twilio/flex-sdk/taskrouter";
import { useLocation } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";
import { initReservationListener } from "../state/listener";

// exchangeToken/refreshToken responses carry the expiry in `tokenInfo.expiration` (an ISO
// string, e.g. "2026-08-03T11:16:03Z") even though it's typed as an untyped `object`.
interface TokenInfo {
    expiration?: string;
}

const getExpiryFromTokenInfo = (tokenInfo: unknown): number | undefined => {
    const expiration = (tokenInfo as TokenInfo | undefined)?.expiration;
    if (!expiration) {
        return undefined;
    }
    const parsed = new Date(expiration).getTime();
    return Number.isNaN(parsed) ? undefined : parsed;
};

// Cache the token's expiry alongside it so the next page load can check it without an API call.
// Prefer the expiry the token response already carries; only fall back to validateToken (an
// extra round trip) when that's unavailable, e.g. after the SDK's own tokenUpdated event.
const persistTokenWithExpiry = async (
    setData: (key: string, value: unknown) => void,
    accountSid: string,
    accessToken: string,
    newRefreshToken?: string,
    tokenInfo?: unknown
): Promise<void> => {
    setData("jweToken", accessToken);
    if (newRefreshToken) {
        setData("refreshToken", newRefreshToken);
    }

    const expiryFromTokenInfo = getExpiryFromTokenInfo(tokenInfo);
    if (expiryFromTokenInfo !== undefined) {
        setData("tokenExpiry", expiryFromTokenInfo);
        return;
    }

    try {
        const tokenData = await validateToken(accountSid, accessToken);
        setData("tokenExpiry", new Date(tokenData.dateExpired).getTime());
    } catch (error) {
        console.error("Failed to validate token expiry", error);
    }
};

export interface useSdkClientReturn {
    sdkClient: Client | undefined;
    worker: Worker | null | undefined;
    token: string | null | undefined;
    voiceCall: VoiceCall | undefined;
    dataClient: FlexDataClient | null;
    connectionState: SdkConnectionState | undefined;
}

export const useSdkClient = (): useSdkClientReturn => {
    const { getData, removeData, setData } = useLocalStorage();
    const [sdkClient, setSdkClient] = useState<Client | undefined>(undefined);
    const [worker, setWorkerObj] = useState<Worker | null>(null);
    const [jweToken, setJweToken] = useState<string | null | undefined>(getData("jweToken"));
    const [voiceCall, setVoiceVoiceCall] = useState<VoiceCall>();
    const [dataClient, setDataClient] = useState<FlexDataClient | null>(null);
    const [connectionState, setConnectionState] = useState<SdkConnectionState | undefined>(undefined);

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
                setData("ssoProfileSid", authConfig.ssoProfileSid);
                setData("accountSid", authConfig.accountSid);
                await persistTokenWithExpiry(
                    setData,
                    authConfig.accountSid,
                    tokenResponse.accessToken,
                    tokenResponse.refreshToken,
                    tokenResponse.tokenInfo
                );
                setJweToken(tokenResponse.accessToken);
                window.history.replaceState({}, document.title, "/agentDesktop");
            };
            exchangeTokenHandler();
        }
    }, []);

    useEffect(() => {
        if (!jweToken) return;

        const initializeSdkClient = async () => {
            try {
                const storedRefreshToken = getData<string>("refreshToken");
                const ssoProfileSid = getData<string>("ssoProfileSid");
                const accountSid = getData<string>("accountSid");
                const tokenExpiry = getData<number>("tokenExpiry");
                const isTokenExpired = typeof tokenExpiry === "number" && tokenExpiry <= Date.now();

                if (isTokenExpired && storedRefreshToken && ssoProfileSid && accountSid) {
                    const refreshed = await refreshToken({ refreshToken: storedRefreshToken, ssoProfileSid });
                    await persistTokenWithExpiry(
                        setData,
                        accountSid,
                        refreshed.accessToken,
                        refreshed.refreshToken,
                        refreshed.tokenInfo
                    );
                    // Update state so this effect re-runs with the freshly refreshed token.
                    setJweToken(refreshed.accessToken);
                    return;
                }

                let sessionOptions: SessionOptions = {
                    autoUpdateToken: false
                };
                if (ssoProfileSid && storedRefreshToken) {
                    sessionOptions = {
                        refreshToken: storedRefreshToken,
                        ssoProfileSid: ssoProfileSid,
                        autoUpdateToken: true,
                        isConsoleLogin: false
                    };
                }

                const client = await createClient(jweToken, {
                    logger: { level: "debug" },
                    voiceOptions: { autoAcceptIncomingCalls: true },
                    session: sessionOptions
                });

                client.addListener(ClientEvent.ConnectionStateChanged, (state: SdkConnectionState) => {
                    console.log("[FlexSDK] connectionStateChanged", state);
                    setConnectionState(state);
                });
                console.log("SDK Client initialized", client.connectionState);

                const worker = await client.getWorker();
                setWorkerObj(worker);

                initReservationListener(client, worker);

                worker.setMaxListeners(100);
                client.addListener(ClientEvent.TokenUpdated, (tokenPayload: string, refreshTokenPayload?: string) => {
                    const currentAccountSid = getData<string>("accountSid");
                    if (currentAccountSid) {
                        persistTokenWithExpiry(setData, currentAccountSid, tokenPayload, refreshTokenPayload);
                    } else {
                        setData("jweToken", tokenPayload);
                    }
                });

                client.execute(
                    new AddVoiceEventListener(VoiceClientEvent.Incoming, (call: unknown) => {
                        setVoiceVoiceCall(call as VoiceCall);
                    })
                );

                const initDataClient = new InitializeDataClient();
                const initializedDataClient = await client.execute(initDataClient);
                setDataClient(initializedDataClient);

                setSdkClient(client);
            } catch (error) {
                console.error("Failed to initialize SDK Client and Worker", error);
                window.location.replace("/");
            }
        };

        initializeSdkClient();
    }, [jweToken]);

    return { sdkClient, worker, token: jweToken, voiceCall, dataClient, connectionState };
};
