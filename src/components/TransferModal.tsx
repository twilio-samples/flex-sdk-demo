import {
    Box,
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalFooterActions,
    ModalHeader,
    ModalHeading,
    Text,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel
} from "@twilio-paste/core";
import { useUID } from "@twilio-paste/core/uid-library";
import { Client } from "@twilio/flex-sdk/actions/Conversation";
import React from "react";
import { useWorkersInfo } from "../hooks/useWorkersInfo";
import { useQueues } from "../hooks/useQueues";
import { Card } from "./ui/Card";
import { DarkModal } from "./ui/DarkModal";
import { ModalCancelButton } from "./ui/ModalCancelButton";

export interface TransferModalProps {
    client: Client;
    onSelect: (targetSid: string, consult?: boolean) => Promise<unknown>;
    disabled?: boolean;
    canConsult?: boolean;
}

interface TransferTarget {
    sid: string;
    label: string;
}

interface TransferListProps {
    targets: TransferTarget[];
    canConsult: boolean;
    onSelect: (targetSid: string, consult?: boolean) => Promise<unknown>;
    onDone: () => void;
}

/** Renders a list of transfer targets (workers or queues) with Transfer/Consult actions. */
function TransferList({ targets, canConsult, onSelect, onDone }: TransferListProps) {
    const [loading, setLoading] = React.useState(false);

    const handleSelect = async (targetSid: string, consult: boolean) => {
        setLoading(true);
        await onSelect(targetSid, consult).finally(() => {
            onDone();
            setLoading(false);
        });
    };

    return (
        <>
            {targets.map((target) => (
                <Card
                    key={target.sid}
                    borderWidth="borderWidth10"
                    borderRadius="borderRadius20"
                    marginBottom="space30"
                    padding="space40"
                    flexDirection="row"
                    alignItems="center"
                >
                    <Box flex={1}>
                        <Text as="span" color="colorText" fontWeight="fontWeightSemibold">
                            {target.label}
                        </Text>
                    </Box>
                    <Box marginLeft="space30">
                        <Button variant="primary" loading={loading} onClick={() => handleSelect(target.sid, false)}>
                            Transfer
                        </Button>
                    </Box>
                    {canConsult && (
                        <Box marginLeft="space30">
                            <Button variant="primary" loading={loading} onClick={() => handleSelect(target.sid, true)}>
                                Consult
                            </Button>
                        </Box>
                    )}
                </Card>
            ))}
        </>
    );
}

export const TransferModal = ({ disabled, client, onSelect, canConsult = false }: TransferModalProps) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedTab, setSelectedTab] = React.useState("workers");

    const { workers, refetchWorkers } = useWorkersInfo(client);
    const { queues, refetchQueues } = useQueues(client);

    const handleOpen = () => {
        setIsOpen(true);
        refetchWorkers();
        refetchQueues();
    };
    const handleClose = () => setIsOpen(false);

    const modalHeadingID = useUID();

    return (
        <DarkModal>
            <div>
                <Button variant="secondary" disabled={disabled} onClick={handleOpen}>
                    Transfer
                </Button>
                <Modal ariaLabelledby={modalHeadingID} isOpen={isOpen} onDismiss={handleClose} size="wide">
                    <ModalHeader>
                        <ModalHeading as="h3" id={modalHeadingID}>
                            Transfer Task
                        </ModalHeading>
                    </ModalHeader>
                    <ModalBody>
                        <Tabs selectedId={selectedTab}>
                            <TabList aria-label="Transfer options">
                                <Tab id="workers" onClick={() => setSelectedTab("workers")}>
                                    Workers
                                </Tab>
                                <Tab id="queues" onClick={() => setSelectedTab("queues")}>
                                    Queues
                                </Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel>
                                    <TransferList
                                        targets={(workers ?? []).map((worker) => ({
                                            sid: worker.sid,
                                            label: worker.friendlyName
                                        }))}
                                        canConsult={canConsult}
                                        onSelect={onSelect}
                                        onDone={handleClose}
                                    />
                                </TabPanel>
                                <TabPanel>
                                    <TransferList
                                        targets={(queues ?? []).map((queue) => ({
                                            sid: queue.sid,
                                            label: queue.name || queue.sid
                                        }))}
                                        canConsult={canConsult}
                                        onSelect={onSelect}
                                        onDone={handleClose}
                                    />
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </ModalBody>
                    <ModalFooter>
                        <ModalFooterActions>
                            <ModalCancelButton onClick={handleClose} />
                        </ModalFooterActions>
                    </ModalFooter>
                </Modal>
            </div>
        </DarkModal>
    );
};
