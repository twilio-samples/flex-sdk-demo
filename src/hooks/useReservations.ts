import { useAppState } from "../state/appState";

export const useReservations = () => {
    const reservations = useAppState((state) => state.reservations);
    return reservations;
};
