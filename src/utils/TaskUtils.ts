export function getTaskName(attributes: Record<string, unknown>): string {
    return (attributes.name || attributes.outbound_to || attributes.from || attributes.customerAddress) as string;
}
