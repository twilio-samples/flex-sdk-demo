import { useEffect, useState } from "react";
import { Client as SyncClient } from "twilio-sync";
export interface LiveReservation {
    task_status: string;
    date_updated: string;
    task_date_created: string;
    task_routing_target: string;
    date_created: string;
    task_sid: string;
    worker_name: string;
    workspace_sid: string;
    task_channel_unique_name: string;
    queue_name: string;
    worker_sid: string;
    task_priority: number;
    task_age: number;
    reservation_sid: string;
    attributes: any;
    status: string;
}
export interface WorkerWithTasks {
    worker_sid: string;
    friendlyName: string;
    activity_name: string;
    available: boolean;
    attributes: any;
    date_activity_changed: string;
    worker_activity_sid: string;
    reservations : LiveReservation[];
}

export interface WorkerWithTasksMap {
    [workerSid: string]: WorkerWithTasks;
}

export function useWorkerTasks(syncClient: SyncClient | null, isReady: boolean) {
    const [workers, setWorkers] = useState<WorkerWithTasksMap>({});
    const [reservations, setReservations] = useState<LiveReservation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!syncClient || !isReady) return;

        console.log("Updating workers with reservations");
        console.log("Current reservations:", reservations);
        
        // Group reservations by worker_sid
        const reservationsByWorker: { [workerSid: string]: LiveReservation[] } = {};
        reservations.forEach((reservation) => {
            const workerSid = reservation.worker_sid;
            if (!reservationsByWorker[workerSid]) {
                reservationsByWorker[workerSid] = [];
            }
            reservationsByWorker[workerSid].push(reservation);
        });

        setWorkers(prev => {
            const updated = { ...prev };
            
            // Clear existing reservations for all workers first
            Object.keys(updated).forEach(workerSid => {
                updated[workerSid] = {
                    ...updated[workerSid],
                    reservations: []
                };
            });
            
            Object.entries(reservationsByWorker).forEach(([workerSid, workerReservations]) => {
                if (updated[workerSid]) {
                    updated[workerSid] = {
                        ...updated[workerSid],
                        reservations: workerReservations
                    };
                }
            });
            
            return updated;
        });

    }, [reservations, syncClient, isReady]);

    useEffect(() => {
        if (!syncClient || !isReady) return;

        let workerQuery: any = null;
        let reservationQuery: any = null;
        let taskQuery: any = null;

        const initLiveQueries = async () => {
            try {
                // LiveQuery for ALL workers (including offline)
                workerQuery = await syncClient.liveQuery("tr-worker", '');

                console.log('Worker LiveQuery initialized');

                // Get initial worker data
                const initialWorkers = workerQuery.getItems() || {};
                setWorkers(initialWorkers);

                // Listen for worker updates
                workerQuery.on("itemAdded", (args: any) => {
                    console.log("Worker added:", args.key);
                    setWorkers(prev => ({
                        ...prev,
                        [args.key]: args.value
                    }));
                });

                workerQuery.on("itemUpdated", (args: any) => {
                    
                    setWorkers(prev => ({
                        ...prev,
                        [args.key]: {
                            ...prev[args.key],
                            ...args.value
                        }
                    }));
                });

                workerQuery.on("itemRemoved", (args: any) => {
                    console.log("Worker removed:", args.key);
                    setWorkers(prev => {
                        const updated = { ...prev };
                        delete updated[args.key];
                        return updated;
                    });
                });

                // LiveQuery for reservations
                reservationQuery = await syncClient.liveQuery("tr-reservation", "data.task_status != 'completed' AND data.task_status != 'canceled' AND data.task_status != 'pending'");

                console.log('Reservation LiveQuery initialized');
                const initialReservations = reservationQuery.getItems() as Map<string, LiveReservation>;

                setReservations(Object.values(initialReservations));

                // // Listen for reservation updates
                reservationQuery.on("itemAdded", (args: any) => {
                    console.log("Reservation added:", args.key);
                    setReservations(prev => [...prev, args.value]);
                });

                reservationQuery.on("itemUpdated", (args: any) => {
                    console.log("Reservation updated:", args.key);
                    setReservations(prev => prev.map(r => r.reservation_sid === args.key ? args.value : r));
                });

                reservationQuery.on("itemRemoved", (args: any) => {
                    console.log("Reservation removed:", args.key);
                    setReservations(prev => prev.filter(r => r.reservation_sid !== args.key));
                });


                setLoading(false);
            } catch (error) {
                console.error('Error initializing LiveQueries:', error);
                setLoading(false);
            }
        };

        initLiveQueries();

        return () => {
            if (workerQuery) {
                workerQuery.close();
            }
            if (reservationQuery) {
                reservationQuery.close();
            }
            if (taskQuery) {
                taskQuery.close();
            }
        };
    }, [syncClient, isReady]);


    return { workers: workers, reservations, loading };
}
