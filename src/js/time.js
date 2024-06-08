import { parse } from "chrono-node";
import { DateTime } from "luxon";

export const createTomorrowDateWithTime = (dueString, tz) => {
    const dueParsed = parse(dueString)[0];
    const { hour, minute } = dueParsed?.start.knownValues || {
        hour: undefined,
        minute: undefined,
    };

    if (!hour) return { extractedTime: null, tomorrowInMS: null };

    const now = DateTime.now().setZone(tz);
    const tomorrow = now.plus({ days: 1 }).set({ hour, minute, second: 0, millisecond: 0 });

    return { extractedTime: dueParsed.text, tomorrow };
};