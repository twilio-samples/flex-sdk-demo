import { useState } from "react";
import { Box, Text, Table, THead, Tr, Th, TBody, Td, Heading, Card, Spinner } from "@twilio-paste/core";
import { Client } from "@twilio/flex-sdk";
import { Worker } from "@twilio/flex-sdk/taskrouter";
import { useEffect } from "react";
import { useWorkersInfo } from "../hooks/useWorkersInfo";
import { useSyncClient } from "../hooks/useSyncClient";
import { useWorkerTasks } from "../hooks/useWorkerTasks";

interface Props {
    sdkClient: Client;
    worker: Worker | null | undefined;
}

export function SupervisorView({ sdkClient }: Props) {
    const { workers: workersInfo, refetchWorkers } = useWorkersInfo(sdkClient);
    const { syncClient, isReady } = useSyncClient(sdkClient);
    const { workers, reservations, loading } = useWorkerTasks(syncClient, isReady);

    useEffect(() => {
        refetchWorkers();
    }, []);

    return (
        <Box padding="space100" backgroundColor="colorBackgroundBody" height="100%" overflow="auto">
            {/* Workers Overview */}
            <Box marginBottom="space100">
                <Heading as="h2" variant="heading20" marginBottom="space0">
                    Workers Overview
                </Heading>
                <Table>
                    <THead>
                        <Tr>
                            <Th>Agent</Th>
                            <Th>Calls</Th>
                            <Th>Messages</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {Array.from(workers.values()).map((agent) => (
                            <Tr key={agent.worker_sid}>
                                <Td>
                                    <Text as="p">{agent.attributes.full_name}</Text>
                                    <Text as="p" color="colorTextWeak">{agent.activity_name}</Text>
                                </Td>
                                <Td>
                                    <Text as="p">{0}</Text>
                                </Td>
                                <Td>
                                    <Text as="p">{0}</Text>
                                </Td>
                            </Tr>
                        ))}
                    </TBody>
                </Table>
            </Box>

         
        </Box>
    );
}
