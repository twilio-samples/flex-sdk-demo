import {
    Box,
    SideModal,
    SideModalBody,
    SideModalButton,
    SideModalContainer,
    SideModalHeader,
    SideModalHeading,
    useSideModalState
} from "@twilio-paste/core";
import { Client } from "@twilio/flex-sdk/actions/Conversation";
import { DialpadIcon } from "@twilio-paste/icons/esm/DialpadIcon";
import { OutboundDialer } from "./OutboundDialer";
import { Theme } from "@twilio-paste/theme";

export function OutboundDialerModal({ client }: { client: Client }) {
    const state = useSideModalState();
    return (
        <Theme.Provider theme="dark">
            <SideModalContainer state={state}>
                <SideModalButton variant="secondary_icon">
                    <DialpadIcon decorative={false} title="Open Dialer" color={"colorTextInverse"} />
                </SideModalButton>
                <SideModal aria-label="Outbound Dialer Modal">
                    <SideModalHeader>
                        <SideModalHeading>Dialer</SideModalHeading>
                    </SideModalHeader>
                    <SideModalBody>
                        <Box alignItems={"center"} justifyContent={"center"} width={"100%"} display="flex">
                            <OutboundDialer
                                client={client}
                                startOutboundCallOptions={{
                                    conferenceOptions: {
                                        endConferenceOnExit: true,
                                        endConferenceOnCustomerExit: true
                                    }
                                }}
                                onCallCreated={() => {
                                    state.hide();
                                }}
                            />
                        </Box>
                    </SideModalBody>
                </SideModal>
            </SideModalContainer>
        </Theme.Provider>
    );
}
