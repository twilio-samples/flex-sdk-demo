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
import { Theme } from "@twilio-paste/theme";
import { Client } from "@twilio/flex-sdk/actions/Conversation";
import React from "react";
import { useWorkersInfo } from "../hooks/useWorkersInfo";
import { useQueues } from "../hooks/useQueues";

export const TransferModal = ({
    disabled,
    client,
    onSelect,
    canConsult = false
}: {
    client: Client;
    onSelect: (targetSid: string, consult?: boolean) => Promise<any>;
    disabled?: boolean;
    canConsult?: boolean;
}) => {
    // Modal properties
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [selectedTab, setSelectedTab] = React.useState("workers");

    const handleOpen = () => {
        setIsOpen(true);
        refetchWorkers();
        refetchQueues();
    };
    const handleClose = () => setIsOpen(false);

    const { workers, refetchWorkers } = useWorkersInfo(client);

    const { queues, refetchQueues } = useQueues(client);

    const modalHeadingID = "modal-heading";

    return (
        <Theme.Provider theme="dark">
            <div>
                <Button variant="secondary" disabled={disabled} onClick={handleOpen}>
                    Transfer
                </Button>
                <Modal ariaLabelledby={modalHeadingID} isOpen={isOpen} onDismiss={handleClose} size="default">
                    <ModalHeader>
                        <ModalHeading as="h3" id={modalHeadingID}>
                            Transfer Task
                        </ModalHeading>
                    </ModalHeader>
                    <ModalBody>
                        <Tabs selectedId={selectedTab}>
                            <TabList aria-label="Transfer options">
                                <Tab
                                    id="workers"
                                    onClick={() => setSelectedTab("workers")}
                                    style={{
                                        backgroundColor:
                                            selectedTab === "workers" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                                        fontWeight: selectedTab === "workers" ? "bold" : "normal"
                                    }}
                                >
                                    Workers
                                </Tab>
                                <Tab
                                    id="queues"
                                    onClick={() => setSelectedTab("queues")}
                                    style={{
                                        backgroundColor:
                                            selectedTab === "queues" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                                        fontWeight: selectedTab === "queues" ? "bold" : "normal"
                                    }}
                                >
                                    Queues
                                </Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel>
                                    {workers?.map((worker) => {
                                        return (
                                            <Box
                                                key={worker.sid}
                                                backgroundColor="colorBackgroundBodyInverse"
                                                borderRadius="borderRadius20"
                                                marginBottom="space30"
                                                padding="space40"
                                                display="flex"
                                                flexDirection={"row"}
                                            >
                                                <Box flex={1}>
                                                    <Text as="span" color="colorTextInverse">
                                                        {worker.friendlyName}
                                                    </Text>
                                                </Box>
                                                <Box marginLeft={"space30"}>
                                                    <Button
                                                        variant="primary"
                                                        loading={loading}
                                                        onClick={async () => {
                                                            setLoading(true);
                                                            await onSelect(worker.sid, false).finally(() => {
                                                                handleClose();
                                                                setLoading(false);
                                                            });
                                                        }}
                                                    >
                                                        Transfer
                                                    </Button>
                                                </Box>
                                                {canConsult && (
                                                    <Box marginLeft={"space30"}>
                                                        <Button
                                                            variant="primary"
                                                            loading={loading}
                                                            onClick={async () => {
                                                                setLoading(true);
                                                                await onSelect(worker.sid, true).finally(() => {
                                                                    handleClose();
                                                                    setLoading(false);
                                                                });
                                                            }}
                                                        >
                                                            Consult
                                                        </Button>
                                                    </Box>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </TabPanel>
                                <TabPanel>
                                    {queues?.map((queue) => {
                                        return (
                                            <Box
                                                key={queue.sid}
                                                backgroundColor="colorBackgroundBodyInverse"
                                                borderRadius="borderRadius20"
                                                marginBottom="space30"
                                                padding="space40"
                                                display="flex"
                                                flexDirection={"row"}
                                            >
                                                <Box flex={1}>
                                                    <Text as="span" color="colorTextInverse">
                                                        {queue.name || queue.sid}
                                                    </Text>
                                                </Box>
                                                <Box marginLeft={"space30"}>
                                                    <Button
                                                        variant="primary"
                                                        loading={loading}
                                                        onClick={async () => {
                                                            setLoading(true);
                                                            await onSelect(queue.sid, false).finally(() => {
                                                                handleClose();
                                                                setLoading(false);
                                                            });
                                                        }}
                                                    >
                                                        Transfer
                                                    </Button>
                                                </Box>
                                                {canConsult && (
                                                    <Box marginLeft={"space30"}>
                                                        <Button
                                                            variant="primary"
                                                            loading={loading}
                                                            onClick={async () => {
                                                                setLoading(true);
                                                                await onSelect(queue.sid, true).finally(() => {
                                                                    handleClose();
                                                                    setLoading(false);
                                                                });
                                                            }}
                                                        >
                                                            Consult
                                                        </Button>
                                                    </Box>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </ModalBody>
                    <ModalFooter>
                        <ModalFooterActions>
                            <Button variant="secondary" onClick={handleClose}>
                                Cancel
                            </Button>
                        </ModalFooterActions>
                    </ModalFooter>
                </Modal>
            </div>
        </Theme.Provider>
    );
};
