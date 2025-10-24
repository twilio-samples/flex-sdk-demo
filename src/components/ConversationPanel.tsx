import {
    Box,
    Button,
    ChatBubble,
    ChatLog,
    ChatMessage,
    ChatMessageMeta,
    ChatMessageMetaItem,
    Flex,
    Input,
    Text
} from "@twilio-paste/core";
import {
    Client,
    Conversation,
    GetConversationTransfers,
    GetConversationByTask,
} from "@twilio/flex-sdk/actions/Conversation";
import {
    GetTaskParticipants,
    TaskParticipant,
} from "@twilio/flex-sdk/actions/Task";
import {
    Media,
    Message as TwilioMessage
} from "@twilio/flex-sdk";
import { Worker } from "@twilio/flex-sdk/taskrouter";
import { useEffect, useRef, useState } from "react";
import { AttachIcon } from "@twilio-paste/icons/esm/AttachIcon";
import { SendIcon } from "@twilio-paste/icons/esm/SendIcon";
import { MediaPickerModal } from "./MediaPickerModal";
import { EmailEditor } from "./EmailEditor";
import { useReservation } from "../hooks/useReservation";

type Message = {
    type: "message";
    body: string | null;
    htmlURL: string | null;
    subject: string | null;
    author: string | null;
    dateCreated: Date | null;
    media: Media;
    variant: "inbound" | "outbound";
};

type TransferMessage = {
    type: "transfer";
    body: string | null;
    dateCreated: Date | null;
};

export function isAnonymousUserSid(maybeAnonymousUserSid: string | undefined): boolean {
    return Boolean(maybeAnonymousUserSid?.startsWith("FX") && maybeAnonymousUserSid?.length === 34);
}

export function ConversationPanel({
    client,
    worker,
    reservationSid
}: {
    client: Client;
    worker: Worker;
    reservationSid: string;
}): JSX.Element | null {
    const [input, setInput] = useState<string>("");
    const [htmlInput, setHtmlInput] = useState<string>("");
    const [subject, setSubject] = useState<string>("");

    const [conversation, setConversation] = useState<Conversation>();
    const fileRef = useRef<HTMLInputElement>(null);
    const [messages, setMessages] = useState<(Message | TransferMessage)[]>([]);
    const reservation = useReservation(reservationSid);

    const [participants, setParticipants] = useState<TaskParticipant[]>([]);

    const isEmailTask = reservation?.task.attributes.channelType === "email";
    const ref = useRef<HTMLDivElement>(null);

    const fetchParticipants = async () => {
        const taskSid = reservation?.task.sid;
        if (!taskSid) {
            return;
        }
        const response = await client.execute(new GetTaskParticipants(taskSid));
        setParticipants(response);
    };

    useEffect(() => {
        const taskSid = reservation?.task.sid;
        if (!taskSid) {
            return;
        }

        const messageAddedListener = async (message: TwilioMessage) => {
            let htmlURL = undefined;
            if (isEmailTask) {
                htmlURL = await message.getEmailBody("text/html")?.getContentTemporaryUrl();
                setSubject(message.subject ?? "");
            }
            const newMessage = {
                type: "message",
                body: message.body,
                author: isAnonymousUserSid(message.author ?? "") ? "Anonymous" : message.author,
                dateCreated: message.dateCreated,
                media: message.attachedMedia?.[0],
                subject: message.subject,
                htmlURL,
                variant: message.author === worker?.friendlyName ? "outbound" : "inbound"
            } as Message;
            setMessages((prevMessages) => [...prevMessages, newMessage]);
            ref.current?.scrollTo({
                top: ref.current.scrollHeight,
                behavior: "smooth"
            });
        };
        const fetchLogs = async () => {
            try {
                const response = await client.execute(new GetConversationByTask(taskSid));
                setConversation(response);
                const messages = await Promise.all(
                    (
                        await response.getMessages()
                    ).items.map(async (message) => {
                        let htmlURL = undefined;
                        if (isEmailTask) {
                            htmlURL = await message.getEmailBody("text/html")?.getContentTemporaryUrl();
                        }
                        return {
                            type: "message",
                            body: message.body,
                            subject: message.subject,
                            author: isAnonymousUserSid(message.author!) ? "Anonymous" : message.author,
                            dateCreated: message.dateCreated,
                            media: message.attachedMedia?.[0],
                            htmlURL: htmlURL,
                            variant: message.author === worker?.friendlyName ? "outbound" : "inbound"
                        } as Message;
                    })
                );

                if (isEmailTask && messages.length > 0) {
                    setSubject(messages[messages.length - 1].subject || "");
                }

                setMessages((prevMessages) =>
                    [...prevMessages, ...messages].sort((a, b) => {
                        return (a.dateCreated?.getTime() || 0) - (b.dateCreated?.getTime() || 0);
                    })
                );
                ref.current?.scrollTo({
                    top: ref.current.scrollHeight,
                    behavior: "smooth"
                });
                response.conversation.on("messageAdded", messageAddedListener);
            } catch (error) {
                console.error("Error fetching chat logs:", error);
            }
        };

        const fetchTransferLogs = async () => {
            const res = await client.execute(new GetConversationTransfers(taskSid));
            if (res.length > 0) {
                const transferMessages = res.map((transfer) => {
                    return {
                        type: "transfer",
                        body: `Transfered to ${transfer.to}`,
                        dateCreated: transfer.dateCreated
                    } as TransferMessage;
                });

                setMessages((prevMessages) =>
                    [...prevMessages, ...transferMessages].sort((a, b) => {
                        return (a.dateCreated?.getTime() || 0) - (b.dateCreated?.getTime() || 0);
                    })
                );
            }
        };

        const fetchParticipants = async () => {
            const response = await client.execute(new GetTaskParticipants(taskSid));
            setParticipants(response);
        };
        setMessages([]);
        fetchLogs();
        fetchTransferLogs();
        fetchParticipants();
        return () => {
            if (conversation) {
                conversation.conversation.removeListener("messageAdded", messageAddedListener);
            }
        };
    }, []);

    if (!reservation) {
        return null;
    }

    return (
        <Box display={"flex"} flexDirection={"column"} height={"100%"}>
            <MediaPickerModal
                fileRef={fileRef}
                onSendMedia={(file: File) => {
                    if (file) {
                        conversation?.sendMessage({ attachedFiles: [file], body: "" });
                        setInput("");
                    }
                }}
            />
            <Box flexBasis={1 as unknown as string} flexGrow={1} overflow={"hidden"}>
                <Box height={"100%"} overflow={"scroll"} ref={ref}>
                    <ChatLog>
                        {messages.map((message, index) => {
                            if (message.type === "message") {
                                return (
                                    <ChatMessage variant={message.variant} key={index}>
                                        <ChatBubble>
                                            <Flex vertical>
                                                {message.subject && "Subject: " + message.subject}

                                                {message.htmlURL ? (
                                                    <iframe style={{ border: 0 }} src={message.htmlURL} />
                                                ) : (
                                                    message.body
                                                )}
                                                {message.media && <ImageMessage media={message.media} />}
                                            </Flex>
                                        </ChatBubble>
                                        <ChatMessageMeta aria-label="">
                                            <ChatMessageMetaItem>
                                                {message.author} ・ {message.dateCreated?.toLocaleString() || ""}
                                            </ChatMessageMetaItem>
                                        </ChatMessageMeta>
                                    </ChatMessage>
                                );
                            } else {
                                return (
                                    <Box width={"100%"} alignItems={"center"} key={index}>
                                        <Text as="p" color="colorTextInverse" textAlign={"center"}>
                                            {message.body}
                                        </Text>
                                    </Box>
                                );
                            }
                        })}
                    </ChatLog>
                </Box>
            </Box>
            <Box display="flex">
                <Box flex={1}>
                    {reservation?.task.attributes.channelType === "email" && (
                        <EmailEditor
                            client={client}
                            reservation={reservation}
                            htmlInput={htmlInput}
                            onChange={setHtmlInput}
                            participants={participants}
                            onParticipantsChange={() => fetchParticipants()}
                            subject={subject}
                            setSubject={setSubject}
                        />
                    )}
                    {reservation?.task.attributes.channelType !== "email" && (
                        <Input
                            aria-describedby="display_name_help_text"
                            id="message_title"
                            name="display_name"
                            type="text"
                            placeholder="Ahoy, World"
                            value={input}
                            onKeyDownCapture={(e) => {
                                if (e.key === "Enter") {
                                    if (input) {
                                        conversation?.sendMessage({ body: input });
                                        setInput("");
                                    }
                                }
                            }}
                            onChange={(e) => {
                                if (e.target.value.length > 0) {
                                    conversation?.sendTyping();
                                }
                                setInput(e.target.value);
                            }}
                            insertAfter={
                                <Button variant="secondary_icon" size="reset" onClick={() => fileRef.current?.click()}>
                                    <Box paddingTop={"space20"} paddingBottom={"space20"}>
                                        <AttachIcon decorative={false} title="attach files to the message" />
                                    </Box>
                                </Button>
                            }
                        />
                    )}
                </Box>

                <Button
                    variant="primary_icon"
                    size="reset"
                    onClick={() => {
                        if (reservation?.task.attributes.channelType === "email") {
                            if (htmlInput) {
                                conversation?.sendMessage({
                                    htmlBody: htmlInput,
                                    plainTextBody: "",
                                    subject: subject
                                });
                                setHtmlInput("");
                            }
                        } else {
                            if (input) {
                                conversation?.sendMessage({ body: input });
                                setInput("");
                            }
                        }
                    }}
                >
                    <Box
                        padding={"space40"}
                        marginRight={"space80"}
                        marginLeft={"space40"}
                        marginBottom="space50"
                        borderRadius={"borderRadiusCircle"}
                        backgroundColor={"colorBackground"}
                    >
                        <SendIcon decorative={false} title="Send" />
                    </Box>
                </Button>
            </Box>
        </Box>
    );
}

function ImageMessage({ media }: { media: Media }) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        media?.getContentTemporaryUrl().then((url) => {
            setImageUrl(url);
        });
    }, [media]);

    if (!imageUrl) {
        return null;
    }

    return <img style={{ maxWidth: "100%", maxHeight: "50vh" }} src={imageUrl} alt="Upload preview" />;
}
