import {
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
import { Client, ResumeConversation } from "@twilio/flex-sdk/actions/Conversation";
import { Theme } from "@twilio-paste/theme";
import { usePausedConversations } from "../hooks/usePausedConversations";
import { getTaskName } from "../utils/TaskUtils";
import { TaskListItemContent } from "./TaskList";

export function PausedConversationsModal({ client }: { client: Client }) {
    const { pausedConversations, refetch } = usePausedConversations(client);
    const dialog = useSideModalState({});

    return (
        <Theme.Provider theme="dark">
            <SideModalContainer placement="right" state={dialog}>
                <SideModalButton variant="secondary_icon" onClick={refetch}>
                    <Text as="span" fontSize={"fontSize30"} color="colorTextBrandInverse">
                        See Paused Conversations
                    </Text>
                </SideModalButton>
                <SideModal aria-label="Paused Conversations Modal">
                    <SideModalHeader>
                        <SideModalHeading>Paused Conversations</SideModalHeading>
                    </SideModalHeader>
                    <SideModalBody>
                        <Box>
                            {(pausedConversations.length as number) === 0 && (
                                <Box
                                    backgroundColor="colorBackgroundBodyInverse"
                                    borderRadius="borderRadius20"
                                    marginBottom="space30"
                                    padding="space40"
                                    display="flex"
                                    flexDirection={"row"}
                                >
                                    <Text as="span" color="colorTextInverse">
                                        There is no paused task
                                    </Text>
                                </Box>
                            )}
                            {pausedConversations.map((pausedConversation) => {
                                const attributes = pausedConversation.attributes;
                                return (
                                    <Box
                                        key={pausedConversation.sid}
                                        backgroundColor="colorBackgroundBodyInverse"
                                        borderRadius="borderRadius20"
                                        marginBottom="space30"
                                        padding="space40"
                                        display="flex"
                                        flexDirection={"row"}
                                    >
                                        <Box flex={1}>
                                            <Text as="span" color="colorTextInverse">
                                                {getTaskName(attributes)}
                                            </Text>

                                            <TaskListItemContent
                                                taskContent={"Paused"}
                                                callTime={new Date(pausedConversation.dateCreated)}
                                            />
                                        </Box>
                                        <Box marginLeft={"space30"}>
                                            <Button
                                                variant="primary"
                                                onClick={() => {
                                                    client.execute(new ResumeConversation(pausedConversation));
                                                    dialog.hide();
                                                }}
                                            >
                                                Resume
                                            </Button>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </SideModalBody>
                </SideModal>
            </SideModalContainer>
        </Theme.Provider>
    );
}
