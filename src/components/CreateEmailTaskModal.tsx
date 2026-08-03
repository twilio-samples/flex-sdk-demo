import {
    Box,
    Button,
    HelpText,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalFooterActions,
    ModalHeader,
    ModalHeading
} from "@twilio-paste/core";
import { useUID } from "@twilio-paste/core/uid-library";
import { PlusIcon } from "@twilio-paste/icons/esm/PlusIcon";
import { Client, StartOutboundEmailTask } from "@twilio/flex-sdk/actions/Conversation";
import React from "react";
import { DarkModal } from "./ui/DarkModal";
import { ModalCancelButton } from "./ui/ModalCancelButton";

export interface CreateEmailTaskModalProps {
    client: Client;
}

export const CreateEmailTaskModal = ({ client }: CreateEmailTaskModalProps) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [hovered, setHovered] = React.useState(false);

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    const modalHeadingID = useUID();
    const emailValid = /.+@.+\..+/.test(email.trim());

    return (
        <DarkModal padding="space80" elements={{ MODAL_DONE_BUTTON: { borderRadius: "borderRadiusPill" } }}>
            <div>
                <Button
                    variant="destructive"
                    size="rounded_small"
                    onClick={handleOpen}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    aria-label="New task"
                >
                    <Box as="span" display="flex" alignItems="center">
                        <Box
                            as="span"
                            overflow="hidden"
                            fontSize="fontSize30"
                            fontWeight="fontWeightSemibold"
                            style={{
                                maxWidth: hovered ? "110px" : "0px",
                                opacity: hovered ? 1 : 0,
                                marginRight: hovered ? "8px" : "0px",
                                whiteSpace: "nowrap",
                                transition: "max-width 200ms ease, opacity 200ms ease, margin-right 200ms ease"
                            }}
                        >
                            New task
                        </Box>
                        <PlusIcon decorative size="sizeIcon20" />
                    </Box>
                </Button>
                <Modal ariaLabelledby={modalHeadingID} isOpen={isOpen} onDismiss={handleClose} size="wide">
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
                            value={email}
                            placeholder="example@twilio.com"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <HelpText id="email_help_text">
                            The customer this outbound email task will be routed to.
                        </HelpText>
                    </ModalBody>
                    <ModalFooter>
                        <ModalFooterActions>
                            <ModalCancelButton onClick={handleClose} />
                            <Button
                                element="MODAL_DONE_BUTTON"
                                variant="destructive"
                                size="rounded_small"
                                loading={loading}
                                disabled={!emailValid}
                                onClick={() => {
                                    setLoading(true);
                                    client.execute(new StartOutboundEmailTask(email)).finally(() => {
                                        handleClose();
                                        setLoading(false);
                                        setEmail("");
                                    });
                                }}
                            >
                                Done
                            </Button>
                        </ModalFooterActions>
                    </ModalFooter>
                </Modal>
            </div>
        </DarkModal>
    );
};
