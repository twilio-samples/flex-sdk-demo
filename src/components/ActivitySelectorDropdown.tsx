import { useState, useCallback, useEffect } from "react";
import {
    Box,
    Button,
    Text,
    Spinner,
    PopoverContainer,
    Popover,
    PopoverButton,
    usePopoverState
} from "@twilio-paste/core";
import { ChevronDownIcon } from "@twilio-paste/icons/esm/ChevronDownIcon";
import { Client } from "@twilio/flex-sdk/actions/Conversation";
import { SetCurrentActivity } from "@twilio/flex-sdk/actions/Worker";
import { Activity, Worker } from "@twilio/flex-sdk/taskrouter";
import { Theme } from "@twilio-paste/theme";
import { useElapsedTimeCounter } from "../hooks/useElapsedTimeCounter";

interface ActivitySelectorDropdownProps {
    client: Client;
    worker: Worker | null | undefined;
}

export function ActivitySelectorDropdown({ client, worker }: ActivitySelectorDropdownProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
    const [isChangingActivity, setIsChangingActivity] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activityChangedDate, setActivityChangedDate] = useState<Date>(worker?.dateActivityChanged || new Date());

    const popover = usePopoverState();

    // Load activities when worker becomes available
    useEffect(() => {
        if (worker?.activities) {
            const activitiesArray = Array.from(worker.activities.values());
            setActivities(activitiesArray);
            setCurrentActivity(worker.activity);
        }
    }, [worker]);

    // Listen for activity updates
    useEffect(() => {
        if (!worker) return;

        const handleActivityUpdated = (worker: Worker) => {
            setCurrentActivity(worker.activity);
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
                const setCurrentActivity = new SetCurrentActivity(activity.sid);
                await client.execute(setCurrentActivity);
                // The activity update will be handled by the event listener
            } catch (err) {
                console.error("Failed to change activity:", err);
                setError(err instanceof Error ? err.message : "Failed to change activity");
                setIsChangingActivity(false);
            }
        },
        [client, worker, currentActivity, popover]
    );

    const getActivityColor = (activity: Activity | null) => {
        if (!activity) return "colorTextInverse";

        if (activity.available) {
            return "colorTextSuccess"; // Green for available
        } else {
            return "colorTextError"; // Red for unavailable/offline
        }
    };

    if (!worker) {
        return (
            <Box display="flex" alignItems="center" padding="space30">
                <Spinner decorative size="sizeIcon20" />
                <Text as="span" color={"colorTextInverse"} marginLeft="space20">
                    Loading...
                </Text>
            </Box>
        );
    }

    return (
        <Box>
            <PopoverContainer state={popover}>
                <Theme.Provider theme="dark">
                    <PopoverButton variant={"reset"}>
                        <Box display="flex" alignItems="center">
                            {isChangingActivity ? (
                                <Spinner decorative size="sizeIcon20" />
                            ) : (
                                <Text
                                    as="span"
                                    color={getActivityColor(currentActivity)}
                                    marginRight="space20"
                                    fontSize="fontSize30"
                                >
                                    ●
                                </Text>
                            )}
                            <Text as="span" color={"colorTextInverse"} marginRight="space20">
                                {currentActivity?.name || "Unknown"}
                            </Text>
                            <ActivityTimeElapsed startTime={activityChangedDate} />
                            <ChevronDownIcon decorative color={"colorTextInverse"} size="sizeIcon20" />
                        </Box>
                    </PopoverButton>
                    <Popover aria-label="Activity Selector">
                        <Box padding="space40" minWidth="200px">
                            <Text as="p" fontSize="fontSize30" fontWeight="fontWeightMedium" marginBottom="space30">
                                Select Activity
                            </Text>
                            {error && (
                                <Box marginBottom="space30">
                                    <Text as="p" color="colorTextError" fontSize="fontSize30">
                                        {error}
                                    </Text>
                                </Box>
                            )}
                            <Box display="flex" flexDirection="column" rowGap="space20">
                                {activities.map((activity) => (
                                    <Button
                                        key={activity.sid}
                                        variant="link"
                                        size="small"
                                        onClick={() => handleActivityChange(activity)}
                                        disabled={isChangingActivity}
                                        style={{
                                            justifyContent: "flex-start",
                                            textAlign: "left",
                                            backgroundColor:
                                                activity.sid === currentActivity?.sid
                                                    ? "rgba(0, 0, 0, 0.1)"
                                                    : "transparent"
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" width="100%">
                                            <Text
                                                as="span"
                                                color={getActivityColor(activity)}
                                                marginRight="space30"
                                                fontSize="fontSize30"
                                            >
                                                ●
                                            </Text>
                                            <Text
                                                as="span"
                                                color="colorText"
                                                fontWeight={
                                                    activity.sid === currentActivity?.sid
                                                        ? "fontWeightMedium"
                                                        : "fontWeightNormal"
                                                }
                                            >
                                                {activity.name}
                                            </Text>
                                            {activity.sid === currentActivity?.sid && (
                                                <Text
                                                    as="span"
                                                    color="colorTextWeak"
                                                    marginLeft="auto"
                                                    fontSize="fontSize30"
                                                >
                                                    ✓
                                                </Text>
                                            )}
                                        </Box>
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    </Popover>
                </Theme.Provider>
            </PopoverContainer>
        </Box>
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
