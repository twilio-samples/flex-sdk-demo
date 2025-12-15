import { Box, Text } from "@twilio-paste/core";
import { WorkerWithTasks } from "../../hooks/useWorkerTasks";
import { UserIcon } from "@twilio-paste/icons/esm/UserIcon";

export interface Props {
    client: any;
    agent: WorkerWithTasks;
    isSelected?: boolean;
    onSelect?: () => void;
}

export const AgentCard = ({ client, agent, isSelected = false, onSelect }: Props) => {
    return (
        <Box 
            display="flex" 
            padding="space30" 
            backgroundColor="colorBackgroundBody"
            borderRadius="borderRadius20"
            borderStyle="solid"
            borderWidth="borderWidth20"
            borderColor={isSelected ? "colorBorderPrimary" : "transparent"}
            columnGap="space30"
            width="100%"
            onClick={onSelect}
            _hover={{
                borderColor: isSelected ? "colorBorderPrimary" : "colorBorderWeaker",
                cursor: "pointer"
            }}
            transition="border-color 150ms ease-in-out"
        >
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                backgroundColor="colorBackgroundPrimaryWeakest"
                borderRadius="borderRadiusCircle"
                padding="space30"
                flexShrink={0}
            >
                <UserIcon size="sizeIcon40" color="colorTextIconAvailable" decorative={false} title={agent.attributes.full_name} />
            </Box>
            <Box display="flex" flexDirection="column" minWidth="0" flex="1">
                <Text as="p">{agent.attributes.full_name}</Text>
                <Text as="p" color="colorTextWeak">
                    {agent.activity_name}
                </Text>
            </Box>
        </Box>
    );
};
