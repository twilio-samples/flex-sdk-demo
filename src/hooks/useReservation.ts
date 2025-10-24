import { useAppState } from "../state/appState";

export const useReservation = (reservationSid: string) => {
    const reservation = useAppState((state) => state.reservations.find((r) => r.sid === reservationSid));
    return reservation;
};
