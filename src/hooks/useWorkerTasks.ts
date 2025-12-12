import { useEffect, useState } from "react";
import { Client as SyncClient } from "twilio-sync";

export interface WorkerWithTasks {
    worker_sid: string;
    friendlyName: string;
    activity_name: string;
    available: boolean;
    attributes: any;
    date_activity_changed: string;
    reservations?: Array<{
        sid: string;
        taskSid: string;
        reservationStatus: string;
        workerSid: string;
        taskAttributes: any;
        taskAge: number;
        taskChannelUniqueName: string;
    }>;
    tasks?: Array<{
        sid: string;
        assignmentStatus: string;
        age: number;
        taskChannelUniqueName: string;
        attributes: any;
        priority: number;
    }>;
}

export function useWorkerTasks(syncClient: SyncClient | null, isReady: boolean) {
    const [workers, setWorkers] = useState<WorkerWithTasks[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                const initialWorkers = Object.values(workerQuery.getItems() || []);
                setWorkers(initialWorkers as WorkerWithTasks[]);
                
                console.log('Initial workers loaded:', initialWorkers);

                // Listen for worker updates
                workerQuery.on("itemAdded", (args: any) => {
                    console.log("Worker added:", args.item.value.friendlyName);
                    setWorkers(prev => [...prev, args.item.value]);
                });

                workerQuery.on("itemUpdated", (args: any) => {
                    console.log("Worker updated:", args.item.value.friendlyName);
                    setWorkers(prev =>
                        prev.map(w => w.worker_sid === args.item.value.sid ? args.item.value : w)
                    );
                });

                workerQuery.on("itemRemoved", (args: any) => {
                    console.log("Worker removed:", args.item.index);
                    setWorkers(prev => prev.filter(w => w.worker_sid !== args.item.value.sid));
                });

                // LiveQuery for reservations
                reservationQuery = await syncClient.liveQuery("tr-reservation", '');

                console.log('Reservation LiveQuery initialized');

                // Get initial reservation data
                const initialReservations = reservationQuery.getItems();
                console.log('Initial reservations loaded:', initialReservations);
                setReservations(initialReservations.map((item: any) => item.value));

                // Listen for reservation updates
                reservationQuery.on("itemAdded", (args: any) => {
                    console.log("Reservation added:", args.item.value.sid);
                    setReservations(prev => [...prev, args.item.value]);
                });

                reservationQuery.on("itemUpdated", (args: any) => {
                    console.log("Reservation updated:", args.item.value.sid);
                    setReservations(prev =>
                        prev.map(r => r.sid === args.item.value.sid ? args.item.value : r)
                    );
                });

                reservationQuery.on("itemRemoved", (args: any) => {
                    console.log("Reservation removed:", args.item.value.sid);
                    setReservations(prev => prev.filter(r => r.sid !== args.item.value.sid));
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

    // Combine workers with their reservations and tasks
    const workersWithData = workers.map(worker => {
        const workerReservations = reservations.filter(r => r.workerSid === worker.sid);
        
        // Get tasks for this worker that are not completed
        const workerTasks = tasks.filter(task => {
            // Find if this task has a reservation for this worker
            const hasReservation = reservations.some(r => 
                r.workerSid === worker.sid && r.taskSid === task.sid
            );
            // Include if task is assigned/reserved to this worker and not completed
            return hasReservation && task.assignmentStatus !== 'completed' && task.assignmentStatus !== 'canceled';
        });
        
        return {
            ...worker,
            reservations: workerReservations,
            tasks: workerTasks
        };
    });

    return { workers: workersWithData, reservations, tasks, loading };
}
