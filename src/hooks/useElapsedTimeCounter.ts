import { useEffect, useRef, useState } from "react";
import {
    differenceInHours,
    differenceInMilliseconds,
    differenceInMinutes,
    differenceInSeconds,
    intervalToDuration
} from "date-fns";

function padZero(number?: number) {
    return String(number || 0).padStart(2, "0");
}

/*
 * 1 seconds: 00:01
 * 1 minute 10 seconds: 01:10
 * 1 hour 10 minutes 5 seconds: 01:10:05
 */
function getDurationText(startTime: Date | number) {
    const now = Date.now();
    const seconds = Math.abs(differenceInSeconds(now, startTime) % 60);
    const minutes = Math.abs(differenceInMinutes(now, startTime) % 60);
    const hours = Math.abs(differenceInHours(now, startTime));

    let durationText = `${padZero(minutes)}:${padZero(seconds)}`;
    if (hours && hours > 0) {
        durationText = `${padZero(hours)}:${durationText}`;
    }
    return durationText;
}

/*
 * 1 seconds: 1s
 * 1 minute 10 seconds: 1m 10s
 * 1 hour 10 minutes 5 seconds: 1h 10m
 */
const getHumanReadableDurationText = (startTime: Date | number): string => {
    const duration = intervalToDuration({
        start: startTime,
        end: Date.now()
    });

    // similar aproach used in flex-web
    duration.years = 0;
    duration.months = 0;
    const extractedDays = Math.floor(differenceInMilliseconds(Date.now(), startTime) / (1000 * 60 * 60 * 24));
    duration.days = extractedDays;

    if (duration.days && duration.days > 0) {
        return `${duration.days}d ${duration.hours}h`;
    }
    if (duration.hours && duration.hours > 0) {
        return `${duration.hours}h ${duration.minutes}m`;
    }
    if (duration.minutes && duration.minutes > 0) {
        return `${duration.minutes}m ${duration.seconds}s`;
    }
    return `${duration.seconds}s`;
};

export type ElapseTimeCounterFormat = "hh:mm:ss" | "xh xm";

function formatDuration(dateCreated: Date, format: ElapseTimeCounterFormat) {
    if (format === "xh xm") {
        return getHumanReadableDurationText(dateCreated);
    }
    return getDurationText(dateCreated);
}

export function useElapsedTimeCounter(
    dateCreated: Date,
    format: ElapseTimeCounterFormat = "hh:mm:ss"
): { elapsedTime: string } {
    const timer = useRef<NodeJS.Timeout>();

    const [elapsedTime, setElapsedTime] = useState(formatDuration(dateCreated, format));

    useEffect(() => {
        setElapsedTime(formatDuration(dateCreated, format));
        timer.current = setInterval(() => {
            setElapsedTime(formatDuration(dateCreated, format));
        }, 1000);

        return () => timer.current && clearInterval(timer.current);
    }, [dateCreated, format]);

    return {
        elapsedTime
    };
}
