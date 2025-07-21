import { parse, ParsedResult } from "chrono-node";
import { DateTime } from "luxon";

/**
 * Extracts the time from a due string, if available.
 * @param {string} dueString - The string to parse for time information.
 * @returns {{ hour: number; minute: number } | null} The extracted hour and minute, or null if no time found.
 */
export const getTaskTime = (dueString: string): { hour: number; minute: number } | null => {
    const dueParsed: ParsedResult | undefined = parse(dueString)[0];

    if (!dueParsed) return null;

    const date: Date = dueParsed.start.date();

    const hour: number = date.getHours();
    const minute: number = date.getMinutes();

    return { hour, minute };
};

/**
 * Creates a Luxon DateTime object with the time extracted from the due string set on the given date.
 * @param {string} dueString - The string to parse for time information.
 * @param {DateTime} [dateTimeObj] - The DateTime object to base time on.
 * @returns {{ extractedTime: string | null; newDate: DateTime | null}} The formatted extracted time and new DateTime object, or nulls if no time found.
 */
export const createDateWithTime = (
    dueString: string,
    dateTimeObj: DateTime = DateTime.now(),
): { extractedTime: string | null; newDate: DateTime | null } => {
    const time = getTaskTime(dueString);
    if (!time) return { extractedTime: null, newDate: null };

    const { hour, minute } = time;
    const newDate = dateTimeObj.set({ hour, minute, second: 0, millisecond: 0 });
    const formattedTime = newDate.toFormat(newDate.minute === 0 ? "h a" : "h:mm a");

    return { extractedTime: formattedTime, newDate };
};
