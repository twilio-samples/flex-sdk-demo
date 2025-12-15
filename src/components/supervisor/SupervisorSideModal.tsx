import { Box, Heading, Text, Button, Select, Option } from "@twilio-paste/core";
import { CloseIcon } from "@twilio-paste/icons/esm/CloseIcon";
import { WorkerWithTasks, LiveReservation } from "../../hooks/useWorkerTasks";
import { Activity, Client, SetWorkerActivity, Worker } from "@twilio/flex-sdk";
import { useEffect, useState } from "react";
import { GetConversationByTask } from "@twilio/flex-sdk/actions/Conversation";

interface ItemType {
    type: 'agent' | 'call' | 'message';
    sid: string;
    obj: WorkerWithTasks | LiveReservation;
}

interface Props {
    client?: Client;
    worker?: Worker;
    isOpen: boolean;
    onClose: () => void;
    item: { type: 'agent', sid: string, obj: WorkerWithTasks } | { type: 'call' | 'message', sid: string, obj: LiveReservation } | null;
}

export const SupervisorSideModal = ({ isOpen, onClose, item , client, worker }: Props) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const onSupervisorChangeWorkerActivity = async (agent: WorkerWithTasks, selectedActivity?: Activity) => {
        const setWorkerActivityAction = new SetWorkerActivity(agent.worker_sid, selectedActivity?.sid || "");
        try {
            await client?.execute(setWorkerActivityAction);
            console.log(`Successfully changed activity for worker ${agent.worker_sid} to ${selectedActivity?.name}`);
        } catch (error) {
            console.error("Error changing worker activity:", error);
        }
    }

    const loadConversationMessages = async (item: { type: 'agent', sid: string, obj: WorkerWithTasks } | { type: 'call' | 'message', sid: string, obj: LiveReservation } | null) => {
        if (!item || item.type === 'agent') return;
        
        setIsLoadingMessages(true);
        const getConversationAction = new GetConversationByTask((item.obj as LiveReservation).task_sid);
        try {
            const conversation = await client?.execute(getConversationAction);
            console.log("Loaded conversation:", conversation);
            
            if (conversation) {
                const messagesPaginator = await conversation.getMessages();
                const allMessages = messagesPaginator.items || [];
                setMessages(allMessages);
                console.log("Loaded messages:", allMessages);
            }
        } catch (error) {
            console.error("Error loading conversation:", error);
            setMessages([]);
        } finally {
            setIsLoadingMessages(false);
        }
    }


    useEffect(() => {
        console.log("Modal item:", item, worker?.activities.values());
        if (item && (item.type === 'call' || item.type === 'message')) {
            loadConversationMessages(item);
        } else {
            setMessages([]);
        }
    }, [item, worker]);

    if (!isOpen || !item) return null;

    return (
        <>
            <Box
                position="fixed"
                top="0"
                left="0"
                right="0"
                bottom="0"
                backgroundColor="colorBackgroundOverlay"
                zIndex="zIndex90"
                onClick={onClose}
            />
        
            <Box
                position="fixed"
                top="0"
                right="0"
                bottom="0"
                width="400px"
                backgroundColor="colorBackgroundBody"
                boxShadow="shadowHigh"
                zIndex="zIndex90"
                padding="space70"
                overflowY="auto"
            >
                <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="space70">
                    <Heading as="h3" variant="heading30" marginBottom="space0">
                        {item.type === 'agent' ? 'Agent Details' : item.type === 'call' ? 'Call Details' : 'Message Details'}
                    </Heading>
                    <Button variant="secondary_icon" size="reset" onClick={onClose}>
                        <CloseIcon decorative={false} title="Close" />
                    </Button>
                </Box>

                <Box>
                    {item.type === 'agent' && (
                        <Box>
                            <Text as="p" fontWeight="fontWeightBold" marginBottom="space30">
                                Worker SID:
                            </Text>
                            <Text as="p" marginBottom="space50" color="colorTextWeak">
                                {item.obj.worker_sid}
                            </Text>

                            <Text as="p" fontWeight="fontWeightBold" marginBottom="space30">
                                Name:
                            </Text>
                            <Text as="p" marginBottom="space50" color="colorTextWeak">
                                {item.obj.attributes?.full_name || item.obj.friendlyName}
                            </Text>

                            <Text as="p" fontWeight="fontWeightBold" marginBottom="space30">
                                Activity:
                            </Text>
                            <Select id="worker-activity" name="worker-activity" onChange={(e) => onSupervisorChangeWorkerActivity(item.obj, worker?.activities.get(e.target.value))} required>
                                { Array.from(worker?.activities.values() || []).map((activity: Activity) => (
                                    <Option 
                                        key={activity.sid} 
                                        value={activity.sid} 
                                        selected={activity.sid === item.obj.worker_activity_sid}
                                    >
                                        {activity.name}
                                    </Option>
                                )) }
                            </Select>

                            <Text as="p" fontWeight="fontWeightBold" marginBottom="space30" marginTop={"space50"}>
                                Attributes:
                            </Text>
                            <Box
                                as="pre"
                                padding="space40"
                                backgroundColor="colorBackgroundWeak"
                                borderRadius="borderRadius20"
                                fontSize="fontSize20"
                                overflowX="auto"
                            >
                                {JSON.stringify(item.obj.attributes, null, 2)}
                            </Box>
                        </Box>
                    )}

                    {(item.type === 'call' || item.type === 'message') && (
                        <Box>
                            <Text as="p" fontWeight="fontWeightBold" marginBottom="space30">
                                Reservation SID:
                            </Text>
                            <Text as="p" marginBottom="space50" color="colorTextWeak">
                                {item.obj.reservation_sid}
                            </Text>

                            <Text as="p" fontWeight="fontWeightBold" marginBottom="space30">
                                Task SID:
                            </Text>
                            <Text as="p" marginBottom="space50" color="colorTextWeak">
                                {item.obj.task_sid}
                            </Text>

                            <Text as="p" fontWeight="fontWeightBold" marginBottom="space30">
                                Status:
                            </Text>
                            <Text as="p" marginBottom="space50" color="colorTextWeak">
                                {item.obj.status}
                            </Text>

                            <Text as="p" fontWeight="fontWeightBold" marginBottom="space30">
                                Queue:
                            </Text>
                            <Text as="p" marginBottom="space50" color="colorTextWeak">
                                {item.obj.queue_name}
                            </Text>

                            <Text as="p" fontWeight="fontWeightBold" marginBottom="space30">
                                Worker:
                            </Text>
                            <Text as="p" marginBottom="space50" color="colorTextWeak">
                                {item.obj.worker_name}
                            </Text>

                            <Text as="p" fontWeight="fontWeightBold" marginBottom="space30">
                                Channel:
                            </Text>
                            <Text as="p" marginBottom="space50" color="colorTextWeak">
                                {item.obj.task_channel_unique_name}
                            </Text>

                            <Text as="p" fontWeight="fontWeightBold" marginBottom="space30">
                                Attributes:
                            </Text>
                            <Box
                                as="pre"
                                padding="space40"
                                backgroundColor="colorBackgroundWeak"
                                borderRadius="borderRadius20"
                                fontSize="fontSize20"
                                overflowX="auto"
                            >
                                {JSON.stringify(item.obj.attributes, null, 2)}
                            </Box>

                            <Text as="p" fontWeight="fontWeightBold" marginBottom="space30" marginTop="space70">
                                Messages:
                            </Text>
                            {isLoadingMessages && (
                                <Box 
                                    display="flex" 
                                    justifyContent="center" 
                                    padding="space60"
                                    backgroundColor="colorBackgroundWeak"
                                    borderRadius="borderRadius20"
                                >
                                    <Text as="p" color="colorTextWeak">Loading messages...</Text>
                                </Box>
                            )}
                            {!isLoadingMessages && messages.length === 0 && (
                                <Box 
                                    display="flex" 
                                    justifyContent="center" 
                                    padding="space60"
                                    backgroundColor="colorBackgroundWeak"
                                    borderRadius="borderRadius20"
                                >
                                    <Text as="p" color="colorTextWeak">No messages available</Text>
                                </Box>
                            )}
                            {!isLoadingMessages && messages.length > 0 && (
                                <Box
                                    backgroundColor="colorBackgroundBody"
                                    borderRadius="borderRadius20"
                                    borderStyle="solid"
                                    borderWidth="borderWidth10"
                                    borderColor="colorBorderWeaker"
                                    maxHeight="500px"
                                    overflowY="auto"
                                >
                                    {messages.map((message, index) => (
                                        <Box 
                                            key={index}
                                            padding="space50"
                                            backgroundColor={message.author === 'Agent' ? "colorBackgroundPrimaryWeakest" : "colorBackgroundBody"}
                                            borderBottomStyle={index < messages.length - 1 ? "solid" : undefined}
                                            borderBottomWidth={index < messages.length - 1 ? "borderWidth10" : undefined}
                                            borderBottomColor={index < messages.length - 1 ? "colorBorderWeaker" : undefined}
                                        >
                                            <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="space30">
                                                <Text as="span" fontWeight="fontWeightBold" fontSize="fontSize30" color="colorTextPrimary">
                                                    {message.author || 'Unknown'}
                                                </Text>
                                                <Text as="span" fontSize="fontSize20" color="colorTextWeaker">
                                                    {message.dateCreated ? new Date(message.dateCreated).toLocaleTimeString() : ''}
                                                </Text>
                                            </Box>
                                            <Text as="div" fontSize="fontSize30" color="colorText" lineHeight="lineHeight40">
                                                {message.body || message.media?.filename || '(no content)'}
                                            </Text>
                                        </Box>
                                    ))}
                                </Box>
                            )}                            
                        </Box>
                    )}
                </Box>
            </Box>
        </>
    );
};