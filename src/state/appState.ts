import { Reservation, TaskParticipant } from "@twilio/flex-sdk";
import { create } from "zustand";

interface AppState {
    reservations: Reservation[];
    addReservation: (reservation: Reservation) => void;
    updateReservation: (reservation: Reservation) => void;
    removeReservation: (reservation: Reservation) => void;
}

export const useAppState = create<AppState>((set) => ({
    reservations: [],
    addReservation: (reservation: Reservation) =>
        set((state: AppState) => ({
            reservations: [...state.reservations, reservation]
        })),
    updateReservation: (reservation: Reservation) => {
        set((state: AppState) => ({
            reservations: state.reservations.map((res) => (res.sid === reservation.sid ? reservation : res))
        }));
    },
    removeReservation: (reservation: Reservation) => {
        set((state: AppState) => ({
            reservations: state.reservations.filter((res) => res.sid !== reservation.sid)
        }));
    }
}));

interface ParticipantState {
    participants: { [key: string]: TaskParticipant[] };
    setParticipants: (reservationSid: string, participants: TaskParticipant[]) => void;
    addParticipant: (reservationSid: string, participant: TaskParticipant) => void;
    updateParticipant: (reservationSid: string, participant: TaskParticipant) => void;
    removeParticipant: (reservationSid: string, participant: TaskParticipant) => void;
    workers: { [key: string]: string };
    setWorkerName(workerSid: string, workerName: string): void;
}

export const useParticipantState = create<ParticipantState>((set) => ({
    participants: {},
    workers: {},
    setWorkerName: (workerSid: string, workerName: string) => {
        set((state: ParticipantState) => ({
            workers: {
                ...state.workers,
                [workerSid]: workerName
            }
        }));
    },
    setParticipants: (reservationSid: string, participants: TaskParticipant[]) => {
        set((state: ParticipantState) => ({
            participants: {
                ...state.participants,
                [reservationSid]: participants
            }
        }));
    },
    addParticipant: (reservationSid: string, participant: TaskParticipant) => {
        set((state: ParticipantState) => ({
            participants: {
                ...state.participants,
                [reservationSid]: [...(state.participants[reservationSid] || []), participant]
            }
        }));
    },
    updateParticipant: (reservationSid: string, participant: TaskParticipant) => {
        set((state: ParticipantState) => ({
            participants: {
                ...state.participants,
                [reservationSid]: state.participants[reservationSid].map((p) =>
                    p.participantSid === participant.participantSid ? participant : p
                )
            }
        }));
    },
    removeParticipant: (reservationSid: string, participant: TaskParticipant) => {
        set((state: ParticipantState) => ({
            participants: {
                ...state.participants,
                [reservationSid]: state.participants[reservationSid].filter(
                    (p) => p.participantSid !== participant.participantSid
                )
            }
        }));
    }
}));
