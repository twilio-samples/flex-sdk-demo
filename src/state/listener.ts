import { Reservation, Client, GetTaskParticipants, Task, TaskParticipant } from "@twilio/flex-sdk";
import { Worker } from "@twilio/flex-sdk/taskrouter";
import { useAppState, useParticipantState } from "./appState";
import { AddTaskParticipantListener } from "@twilio/flex-sdk/actions/Task";

export function initReservationListener(client: Client, worker: Worker) {
    Array.from(worker.reservations.values()).forEach((reservation) => {
        if (
            reservation.status !== "completed" &&
            reservation.status !== "rescinded" &&
            reservation.status !== "canceled" &&
            reservation.status !== "rejected"
        ) {
            useAppState.getState().addReservation(reservation);
            addReservationListeners(client, reservation);
            if (reservation.status === "accepted") {
                initParticipantListener(client, reservation);
            }
        }
    });

    worker.on("reservationCreated", (reservation) => {
        useAppState.getState().addReservation(reservation);
        addReservationListeners(client, reservation);
    });
}

function addReservationListeners(client: Client, reservation: Reservation) {
    reservation.on("accepted", (reservation) => {
        useAppState.getState().updateReservation(reservation);

        initParticipantListener(client, reservation);
    });
    reservation.on("rejected", (reservation) => {
        useAppState.getState().removeReservation(reservation);
    });
    reservation.on("completed", (reservation) => {
        useAppState.getState().removeReservation(reservation);
    });
    reservation.on("wrapup", (reservation) => {
        useAppState.getState().updateReservation(reservation);
    });
    reservation.on("canceled", (reservation) => {
        useAppState.getState().removeReservation(reservation);
    });
    reservation.on("rescinded", (reservation) => {
        useAppState.getState().removeReservation(reservation);
    });
    reservation.on("timeout", (reservation) => {
        useAppState.getState().updateReservation(reservation);
    });
}

async function initParticipantListener(client: Client, reservation: Reservation) {
    const worker = await client.getWorker();
    const workspace = await client.getWorkspace();

    const participants = await client.execute(new GetTaskParticipants(reservation.task.sid));
    useParticipantState.getState().setParticipants(reservation.sid, participants);

    const otherParticipants = participants.filter(
        (p) => p.type === "agent" && p.routingProperties?.workerSid !== worker.workerSid
    );

    otherParticipants.forEach((participant) => {
        const workerSid = participant.routingProperties?.workerSid;
        if (workerSid) {
            workspace
                .fetchWorkerInfo(workerSid)
                .then((worker) => {
                    useParticipantState.getState().setWorkerName(workerSid, worker.attributes.full_name);
                })
                .catch((e) => {
                    console.error("Error fetching worker for participant", workerSid, e);
                });
        }
    });

    const participantAddedListener = async (_task: Task, taskParticipant: TaskParticipant) => {
        try {
            if (taskParticipant.type === "agent" && taskParticipant.mediaProperties?.workerSid !== worker.workerSid) {
                const workerSid = taskParticipant.routingProperties?.workerSid;
                if (workerSid) {
                    workspace
                        .fetchWorkerInfo(workerSid)
                        .then((worker) => {
                            useParticipantState.getState().setWorkerName(workerSid, worker.attributes.full_name);
                        })
                        .catch((e) => {
                            console.error("Error fetching worker for participant", workerSid, e);
                        });
                }
            }
            useParticipantState.getState().addParticipant(reservation.sid, taskParticipant);
        } catch (e) {
            console.error("Error adding participant", e);
        }
    };

    const participantModifiedListener = (_task: Task, participant: TaskParticipant) => {
        try {
            useParticipantState.getState().updateParticipant(reservation.sid, participant);
        } catch (e) {
            console.error("Error modifiying participant", e);
        }
    };

    const participantRemovedListener = (_task: Task, participant: TaskParticipant) => {
        try {
            useParticipantState.getState().removeParticipant(reservation.sid, participant);
        } catch (e) {
            console.error("Error removing participant", e);
        }
    };

    client.execute(new AddTaskParticipantListener(reservation.task.sid, "participantAdded", participantAddedListener));
    client.execute(
        new AddTaskParticipantListener(reservation.task.sid, "participantModified", participantModifiedListener)
    );
    client.execute(
        new AddTaskParticipantListener(reservation.task.sid, "participantRemoved", participantRemovedListener)
    );
}
