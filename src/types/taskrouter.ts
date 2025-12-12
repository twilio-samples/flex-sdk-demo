// TaskRouter types for LiveQuery results

export interface TaskRouterWorker {
    sid: string;
    accountSid: string;
    workspaceSid: string;
    friendlyName: string;
    activityName: string;
    activitySid: string;
    available: boolean;
    attributes: string | Record<string, any>;
    dateCreated: string;
    dateUpdated: string;
    dateStatusChanged: string;
}

export interface TaskRouterReservation {
    sid: string;
    accountSid: string;
    workspaceSid: string;
    taskSid: string;
    workerSid: string;
    reservationStatus: 'pending' | 'accepted' | 'rejected' | 'timeout' | 'canceled' | 'rescinded' | 'wrapping' | 'completed';
    taskChannelSid: string;
    taskChannelUniqueName: string;
    taskAttributes: string | Record<string, any>;
    taskAge: number;
    taskPriority: number;
    dateCreated: string;
    dateUpdated: string;
}

export interface TaskRouterTask {
    sid: string;
    accountSid: string;
    workspaceSid: string;
    workflowSid: string;
    workflowFriendlyName: string;
    taskQueueSid: string;
    taskQueueFriendlyName: string;
    taskChannelSid: string;
    taskChannelUniqueName: string;
    assignmentStatus: 'pending' | 'reserved' | 'assigned' | 'canceled' | 'completed' | 'wrapping';
    attributes: string | Record<string, any>;
    age: number;
    priority: number;
    reason: string | null;
    timeout: number;
    dateCreated: string;
    dateUpdated: string;
    taskQueueEnteredDate: string;
    virtualStartTime: string;
}

export interface LiveQueryItem<T> {
    index: number;
    value: T;
}

export interface LiveQuery<T> {
    getItems(): LiveQueryItem<T>[];
    on(event: 'itemAdded', callback: (args: { item: LiveQueryItem<T> }) => void): void;
    on(event: 'itemUpdated', callback: (args: { item: LiveQueryItem<T> }) => void): void;
    on(event: 'itemRemoved', callback: (args: { item: LiveQueryItem<T> }) => void): void;
    close(): void;
}
