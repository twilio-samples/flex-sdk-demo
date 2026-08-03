import { useState, useCallback, useEffect } from "react";
import {
    Box,
    Button,
    Text,
    Spinner,
    PopoverContainer,
    Popover,
    PopoverButton,
    usePopoverState,
    Separator
} from "@twilio-paste/core";
import { CustomizationProvider } from "@twilio-paste/core/customization";
import { ChevronDownIcon } from "@twilio-paste/icons/esm/ChevronDownIcon";
import { Client } from "@twilio/flex-sdk/actions/Conversation";
import { SetCurrentActivity } from "@twilio/flex-sdk/actions/Worker";
import { Activity, Worker } from "@twilio/flex-sdk/taskrouter";
import { useElapsedTimeCounter } from "../hooks/useElapsedTimeCounter";
import { DROPDOWN_MENU_ELEMENT, PILL_TRIGGER_PROPS } from "./ui/dropdownStyles";

export interface ActivitySelectorDropdownProps {
    client: Client;
    worker: Worker | null | undefined;
}

export function ActivitySelectorDropdown({ client, worker }: ActivitySelectorDropdownProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
    const [isChangingActivity, setIsChangingActivity] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activityChangedDate, setActivityChangedDate] = useState<Date>(worker?.dateActivityChanged || new Date());

    const popover = usePopoverState({});

    useEffect(() => {
        if (worker?.activities) {
            setActivities(Array.from(worker.activities.values()));
            setCurrentActivity(worker.activity);
        }
    }, [worker]);

    useEffect(() => {
        if (!worker) return;
        const handleActivityUpdated = (w: Worker) => {
            setCurrentActivity(w.activity);
            setIsChangingActivity(false);
            setActivityChangedDate(new Date());
        };
        worker.on("activityUpdated", handleActivityUpdated);
        return () => {
            worker.off("activityUpdated", handleActivityUpdated);
        };
    }, [worker]);

    const handleActivityChange = useCallback(
        async (activity: Activity) => {
            if (!client || !worker || activity.sid === currentActivity?.sid) {
                popover.hide();
                return;
            }
            setIsChangingActivity(true);
            setError(null);
            popover.hide();
            try {
                await client.execute(new SetCurrentActivity(activity.sid));
            } catch (err) {
                console.error("Failed to change activity:", err);
                setError(err instanceof Error ? err.message : "Failed to change activity");
                setIsChangingActivity(false);
            }
        },
        [client, worker, currentActivity, popover]
    );

    // Twilio palette (no green): blue = available, red = offline, gray = other unavailable.
    const getActivityColor = (activity: Activity | null) => {
        if (!activity) return "colorText";
        if (activity.available) return "colorTextLink";
        if (/offline/i.test(activity.name)) return "colorTextError";
        return "colorTextWeak";
    };

    if (!worker) {
        return (
            <Box display="flex" alignItems="center" padding="space30">
                <Spinner decorative size="sizeIcon20" />
                <Text as="span" color="colorText" marginLeft="space20">
                    Loading...
                </Text>
            </Box>
        );
    }

    return (
        <CustomizationProvider baseTheme="dark" elements={{ ACTIVITY_MENU: DROPDOWN_MENU_ELEMENT }}>
            <Box>
                <PopoverContainer state={popover}>
                    <PopoverButton variant="reset">
                        <Box {...PILL_TRIGGER_PROPS} paddingX="space50">
                            {isChangingActivity ? (
                                <Spinner decorative size="sizeIcon20" />
                            ) : (
                                <Text as="span" color={getActivityColor(currentActivity)} fontSize="fontSize30">
                                    ●
                                </Text>
                            )}
                            <Text as="span" color="colorText" fontWeight="fontWeightSemibold" fontSize="fontSize30">
                                {currentActivity?.name || "Unknown"}
                            </Text>
                            <ActivityTimeElapsed startTime={activityChangedDate} />
                            <ChevronDownIcon decorative color="colorTextWeak" size="sizeIcon20" />
                        </Box>
                    </PopoverButton>
                    <Popover aria-label="Activity Selector" element="ACTIVITY_MENU">
                        <Box padding="space50" minWidth="260px">
                            <Text
                                as="p"
                                fontSize="fontSize20"
                                fontWeight="fontWeightSemibold"
                                color="colorTextWeak"
                                textTransform="uppercase"
                                marginBottom="space0"
                                style={{ letterSpacing: "0.08em" }}
                            >
                                Set your status
                            </Text>
                            <Separator orientation="horizontal" verticalSpacing="space40" />
                            {error && (
                                <Box marginBottom="space30">
                                    <Text as="p" color="colorTextError" fontSize="fontSize30">
                                        {error}
                                    </Text>
                                </Box>
                            )}
                            <Box display="flex" flexDirection="column" rowGap="space30">
                                {activities.map((activity) => (
                                    <Button
                                        key={activity.sid}
                                        variant="reset"
                                        size="reset"
                                        fullWidth
                                        onClick={() => handleActivityChange(activity)}
                                        disabled={isChangingActivity}
                                    >
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            width="100%"
                                            columnGap="space40"
                                            paddingX="space30"
                                            paddingY="space20"
                                            borderRadius="borderRadius20"
                                            _hover={{ backgroundColor: "colorBackgroundStronger" }}
                                        >
                                            <Text as="span" color={getActivityColor(activity)} fontSize="fontSize50">
                                                ●
                                            </Text>
                                            <Text as="span" color="colorText" fontSize="fontSize50">
                                                {activity.name}
                                            </Text>
                                        </Box>
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    </Popover>
                </PopoverContainer>
            </Box>
        </CustomizationProvider>
    );
}

function ActivityTimeElapsed({ startTime }: { startTime: Date }) {
    const { elapsedTime } = useElapsedTimeCounter(startTime);
    return (
        <Text as="span" color="colorTextWeak" fontSize="fontSize30" fontVariantNumeric="tabular-nums">
            {elapsedTime}
        </Text>
    );
}
