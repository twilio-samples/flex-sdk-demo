import {
    Button,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalFooterActions,
    ModalHeader,
    ModalHeading,
    Text
} from "@twilio-paste/core";
import { Theme } from "@twilio-paste/theme";
import { Client, StartOutboundEmailTask } from "@twilio/flex-sdk/actions/Conversation";
import React from "react";

export const CreateEmailTaskModal = ({ client }: { client: Client }) => {
    // Modal properties
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const [email, setEmail] = React.useState("");
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    const modalHeadingID = "modal-heading";

    return (
        <Theme.Provider theme="dark">
            <div>
                <Button variant="primary" size="rounded_small" onClick={handleOpen}>
                    <Text as="span" fontSize={"fontSize30"} color="colorTextBrandInverse">
                        + New Task
                    </Text>
                </Button>
                <Modal ariaLabelledby={modalHeadingID} isOpen={isOpen} onDismiss={handleClose} size="default">
                    <ModalHeader>
                        <ModalHeading as="h3" id={modalHeadingID}>
                            Create an email task
                        </ModalHeading>
                    </ModalHeader>
                    <ModalBody>
                        <Label htmlFor="email_address" required>
                            Email address
                        </Label>
                        <Input
                            aria-describedby="email_help_text"
                            id="email_address"
                            name="email_address"
                            type="email"
                            placeholder="example@twilio.com"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </ModalBody>
                    <ModalFooter>
                        <ModalFooterActions>
                            <Button variant="secondary" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                loading={loading}
                                onClick={() => {
                                    setLoading(true);
                                    client.execute(new StartOutboundEmailTask(email)).finally(() => {
                                        handleClose();
                                        setLoading(false);
                                    });
                                }}
                            >
                                Done
                            </Button>
                        </ModalFooterActions>
                    </ModalFooter>
                </Modal>
            </div>
        </Theme.Provider>
    );
};
