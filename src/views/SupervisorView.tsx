import { useState } from "react";
import { Box, Text, Table, THead, Tr, Th, TBody, Td, Heading, Card, Spinner } from "@twilio-paste/core";
import { Client } from "@twilio/flex-sdk";
import { Worker } from "@twilio/flex-sdk/taskrouter";
import { useEffect } from "react";
import { useSyncClient } from "../hooks/useSyncClient";
import { useWorkerTasks, WorkerWithTasks, LiveReservation } from "../hooks/useWorkerTasks";
import { SupervisorCallCard } from "../components/supervisor/SupervisorCallCard";
import { AgentCard } from "../components/supervisor/AgentCard";
import { SupervisorMessageCard } from "../components/supervisor/SupervisorMessageCard";
import { SupervisorSideModal } from "../components/supervisor/SupervisorSideModal";

interface Props {
    sdkClient: Client;
    worker?: Worker | null | undefined;
}

export function SupervisorView({ sdkClient, worker }: Props) {
    const { syncClient, isReady } = useSyncClient(sdkClient);
    const { workers } = useWorkerTasks(syncClient, isReady);
    const [selectedItem, setSelectedItem] = useState<{ type: 'agent' | 'call' | 'message', sid: string } | null>(null);
    const [modalItem, setModalItem] = useState<{ type: 'agent', sid: string, obj: WorkerWithTasks } | { type: 'call' | 'message', sid: string, obj: LiveReservation } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const onSelectedItem = (item: { type: 'agent', sid: string, obj: WorkerWithTasks } | { type: 'call' | 'message', sid: string, obj: LiveReservation }) => {
        setSelectedItem({ type: item.type, sid: item.sid });
        setModalItem(item);
        setIsModalOpen(true);
        console.log("Item selected:", item);
        // Add your custom logic here
    };

    useEffect(() => {
        console.log("Workers updated:", workers);
    }, [workers]);

    return (
        <Box padding="space100" backgroundColor="colorBackgroundBody" height="100%" overflow="auto">
            <Box marginBottom="space100">
                <Heading as="h2" variant="heading20" marginBottom="space0">
                    Workers Overview
                </Heading>
                <Table tableLayout="fixed">
                    <THead>
                        <Tr>
                            <Th width="20%">Agent</Th>
                            <Th width="40%">Calls</Th>
                            <Th width="40%">Messages</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {Object.values(workers).map((agent) => {
                            const voiceTaks = agent.reservations?.filter((r) => r.task_channel_unique_name === "voice") || [];
                            const chatTaks = agent.reservations?.filter((r) => r.task_channel_unique_name != "voice") || [];
                            return <Tr key={agent.worker_sid}>
                                <Td>
                                    <AgentCard 
                                        client={sdkClient} 
                                        agent={agent} 
                                        isSelected={selectedItem?.type === 'agent' && selectedItem?.sid === agent.worker_sid}
                                        onSelect={() => onSelectedItem({ type: 'agent', sid: agent.worker_sid, obj: agent })}
                                    />
                                </Td>
                                <Td>
                                    {voiceTaks.length === 0 && <SupervisorCallCard client={sdkClient} />}
                                    {voiceTaks?.map((r) => (
                                        <SupervisorCallCard 
                                            key={r.reservation_sid} 
                                            client={sdkClient} 
                                            reservation={r}
                                            isSelected={selectedItem?.type === 'call' && selectedItem?.sid === r.reservation_sid}
                                            onSelect={() => onSelectedItem({ type: 'call', sid: r.reservation_sid, obj: r })}
                                        />
                                    ))}
                                </Td>
                                <Td>
                                    {chatTaks.length === 0 && <SupervisorMessageCard client={sdkClient} />}
                                    {chatTaks?.map((r) => (
                                        <SupervisorMessageCard 
                                            key={r.reservation_sid} 
                                            client={sdkClient} 
                                            reservation={r}
                                            isSelected={selectedItem?.type === 'message' && selectedItem?.sid === r.reservation_sid}
                                            onSelect={() => onSelectedItem({ type: 'message', sid: r.reservation_sid, obj: r })}
                                        />
                                    ))}
                                </Td>
                            </Tr>
                        })}
                    </TBody>
                </Table>
            </Box>

            <SupervisorSideModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={modalItem}
                client={sdkClient}
                worker={worker}
            />
        </Box>
    );
}
