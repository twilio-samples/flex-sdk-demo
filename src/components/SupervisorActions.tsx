import { useState } from "react";
import {
    Alert,
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
    ModalHeading,
    Text
} from "@twilio-paste/core";
import { ShowIcon } from "@twilio-paste/icons/esm/ShowIcon";
import { Client } from "@twilio/flex-sdk/actions/Conversation";
import { MonitorCall } from "@twilio/flex-sdk/actions/Voice";
import { Worker } from "@twilio/flex-sdk/taskrouter";
import { MonitoredCall } from "./MonitoredCallPanel";
import { DarkModal } from "./ui/DarkModal";
import { ModalCancelButton } from "./ui/ModalCancelButton";

export interface SupervisorActionsProps {
    client: Client;
    worker?: Worker | null;
    /** Called once a monitor call is established, with the call to control. */
    onMonitorStarted: (monitored: MonitoredCall) => void;
}

const isSupervisorOrAdmin = (worker?: Worker | null): boolean =>
    Boolean(
        worker?.attributes?.roles?.includes("supervisor") ||
        worker?.attributes?.roles?.includes("admin") ||
        worker?.attributes?.role === "supervisor" ||
        worker?.attributes?.role === "admin"
    );

/**
 * Supervisor/admin-only actions in the header. Currently: monitor a task by
 * task + reservation SID. Renders nothing for non-supervisors.
 */
export function SupervisorActions({ client, worker, onMonitorStarted }: SupervisorActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [taskSid, setTaskSid] = useState("");
    const [reservationSid, setReservationSid] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const modalHeadingID = "supervisor-monitor-heading";
    const canSubmit = taskSid.trim().length > 0 && reservationSid.trim().length > 0;

    if (!isSupervisorOrAdmin(worker)) {
        return null;
    }

    const handleClose = () => {
        setIsOpen(false);
        setError(null);
    };

    const handleMonitor = async () => {
        setLoading(true);
        setError(null);
        try {
            const trimmedTask = taskSid.trim();
            const trimmedReservation = reservationSid.trim();
            const call = await client.execute(new MonitorCall(trimmedTask, trimmedReservation));
            onMonitorStarted({ call, taskSid: trimmedTask, reservationSid: trimmedReservation });
            setTaskSid("");
            setReservationSid("");
            setIsOpen(false);
        } catch (err) {
            console.error("Failed to monitor call:", err);
            setError(err instanceof Error ? err.message : "Failed to monitor call");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DarkModal>
            <Button variant="secondary" onClick={() => setIsOpen(true)}>
                <ShowIcon decorative />
                Monitor task
            </Button>

            <Modal ariaLabelledby={modalHeadingID} isOpen={isOpen} onDismiss={handleClose} size="default">
                <ModalHeader>
                    <ModalHeading as="h3" id={modalHeadingID}>
                        Monitor a task
                    </ModalHeading>
                </ModalHeader>
                <ModalBody>
                    <Box display="flex" flexDirection="column" rowGap="space50">
                        <Box>
                            <Label htmlFor="monitor-task-sid" required>
                                Task SID
                            </Label>
                            <Input
                                id="monitor-task-sid"
                                type="text"
                                value={taskSid}
                                placeholder="WTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                onChange={(e) => setTaskSid(e.target.value)}
                            />
                        </Box>
                        <Box>
                            <Label htmlFor="monitor-reservation-sid" required>
                                Reservation SID
                            </Label>
                            <Input
                                id="monitor-reservation-sid"
                                type="text"
                                value={reservationSid}
                                placeholder="WRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                onChange={(e) => setReservationSid(e.target.value)}
                            />
                            <HelpText>The agent's reservation for the task you want to monitor.</HelpText>
                        </Box>
                        {error && (
                            <Alert variant="error">
                                <Text as="span">{error}</Text>
                            </Alert>
                        )}
                    </Box>
                </ModalBody>
                <ModalFooter>
                    <ModalFooterActions>
                        <ModalCancelButton onClick={handleClose} />
                        <Button variant="primary" loading={loading} disabled={!canSubmit} onClick={handleMonitor}>
                            Monitor
                        </Button>
                    </ModalFooterActions>
                </ModalFooter>
            </Modal>
        </DarkModal>
    );
}
