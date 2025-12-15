import { ReactNode, useState } from "react";
import { Box, Button, Stack } from "@twilio-paste/core";
import { ChevronDoubleLeftIcon } from "@twilio-paste/icons/esm/ChevronDoubleLeftIcon";
import { ChevronDoubleRightIcon } from "@twilio-paste/icons/esm/ChevronDoubleRightIcon";
import { AgentIcon } from "@twilio-paste/icons/esm/AgentIcon";
import { ProductAdminUsersIcon } from "@twilio-paste/icons/esm/ProductAdminUsersIcon";
import { Header } from "./Header";
import { Client } from "@twilio/flex-sdk";
import type { Worker } from "@twilio/flex-sdk/taskrouter";

interface MainLayoutProps {
    sdkClient: Client;
    worker: Worker | null | undefined;
    activeView: "agent" | "supervisor";
    onViewChange: (view: "agent" | "supervisor") => void;
    children: ReactNode;
}

export function MainLayout({ sdkClient, worker, activeView, onViewChange, children }: MainLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    // Check if user has supervisor or admin role
    const isSupervisor = worker?.attributes?.roles?.includes('supervisor') || 
                         worker?.attributes?.roles?.includes('admin') ||
                         worker?.attributes?.role === 'supervisor' ||
                         worker?.attributes?.role === 'admin';

    return (
        <Box display="flex" flexDirection="column" height="100vh">
            <Header client={sdkClient} worker={worker} />
            <Box display="flex" flex={1} overflow="hidden">
                <Box
                    width={sidebarOpen ? "250px" : ""}
                    backgroundColor="colorBackgroundBodyInverse"
                    borderRightStyle="solid"
                    padding="space60"
                    overflowY="auto"
                    display="flex"
                    flexDirection="column"
                >
                    <Stack orientation="vertical" spacing="space40" element="NAV_STACK">
                        <Button
                            variant={activeView === "agent" ? "primary" : "secondary"}
                            onClick={() => onViewChange("agent")}
                            fullWidth={sidebarOpen}
                        >
                            <AgentIcon decorative />
                            {sidebarOpen && "Agent"}
                        </Button>
                        
                        {isSupervisor && (
                            <Button
                                variant={activeView === "supervisor" ? "primary" : "secondary"}
                                onClick={() => onViewChange("supervisor")}
                                fullWidth={sidebarOpen}
                            >
                                <ProductAdminUsersIcon decorative />
                                {sidebarOpen && "Supervisor"}
                            </Button>
                        )}
                    </Stack>

                    <Box marginTop="auto" paddingTop="space60">
                        <Button variant="secondary_icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            {sidebarOpen ? (
                                <ChevronDoubleLeftIcon decorative />
                            ) : (
                                <ChevronDoubleRightIcon decorative={false} title="Expand menu" />
                            )}
                        </Button>
                    </Box>
                </Box>
                <Box flex={1} overflow="hidden">
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
