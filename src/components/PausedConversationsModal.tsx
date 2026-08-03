import {
    Badge,
    Box,
    Button,
    SideModal,
    SideModalBody,
    SideModalButton,
    SideModalContainer,
    SideModalHeader,
    SideModalHeading,
    Text,
    useSideModalState
} from "@twilio-paste/core";
import { PauseIcon } from "@twilio-paste/icons/esm/PauseIcon";
import { Client, ResumeConversation } from "@twilio/flex-sdk/actions/Conversation";
import { Theme } from "@twilio-paste/theme";
import { usePausedConversations } from "../hooks/usePausedConversations";
import { getTaskName } from "../utils/TaskUtils";
import { TaskListItemContent } from "./TaskList";
import { Card } from "./ui/Card";

export interface PausedConversationsModalProps {
    client: Client;
}

export function PausedConversationsModal({ client }: PausedConversationsModalProps) {
    const { pausedConversations, refetch } = usePausedConversations(client);
    const dialog = useSideModalState({});

    return (
        <Theme.Provider theme="dark">
            <SideModalContainer placement="right" state={dialog}>
                <SideModalButton variant="link" onClick={refetch}>
                    <PauseIcon decorative size="sizeIcon30" />
                    <Text as="span" fontSize="fontSize40" fontWeight="fontWeightSemibold">
                        See paused conversations
                    </Text>
                </SideModalButton>
                <SideModal aria-label="Paused Conversations Modal">
                    <SideModalHeader>
                        <SideModalHeading>Paused conversations</SideModalHeading>
                    </SideModalHeader>
                    <SideModalBody>
                        <Box display="flex" flexDirection="column" rowGap="space30">
                            {(pausedConversations.length as number) === 0 && (
                                <Card borderWidth="borderWidth10" padding="space50">
                                    <Text as="span" color="colorTextWeak">
                                        There are no paused conversations.
                                    </Text>
                                </Card>
                            )}
                            {pausedConversations.map((pausedConversation) => {
                                const attributes = pausedConversation.attributes;
                                return (
                                    <Card
                                        key={pausedConversation.sid}
                                        borderWidth="borderWidth10"
                                        padding="space40"
                                        flexDirection="row"
                                        alignItems="center"
                                        columnGap="space30"
                                    >
                                        <Box flex={1} minWidth={0}>
                                            <Box display="flex" alignItems="center" columnGap="space20">
                                                <Text
                                                    as="span"
                                                    fontSize="fontSize40"
                                                    fontWeight="fontWeightSemibold"
                                                    color="colorText"
                                                >
                                                    {getTaskName(attributes)}
                                                </Text>
                                                <Badge as="span" variant="warning">
                                                    Paused
                                                </Badge>
                                            </Box>
                                            <TaskListItemContent
                                                taskContent={"Paused"}
                                                callTime={new Date(pausedConversation.dateCreated)}
                                            />
                                        </Box>
                                        <Button
                                            variant="primary"
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                client.execute(new ResumeConversation(pausedConversation));
                                                dialog.hide();
                                            }}
                                        >
                                            Resume
                                        </Button>
                                    </Card>
                                );
                            })}
                        </Box>
                    </SideModalBody>
                </SideModal>
            </SideModalContainer>
        </Theme.Provider>
    );
}
