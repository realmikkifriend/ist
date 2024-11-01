import { parse } from "chrono-node";
import { DateTime } from "luxon";

export const getTaskTime = (dueString) => {
    const dueParsed = parse(dueString)[0];
    if (!dueParsed?.start.knownValues.hour) return null;

    const { hour, minute } = dueParsed.start.knownValues;
    return { hour, minute };
};

export const createDateWithTime = (dueString, dateTimeObj = DateTime.now()) => {
    const time = getTaskTime(dueString);
    if (!time) return { extractedTime: null, newDate: null };

    const { hour, minute } = time;
    const newDate = dateTimeObj.set({ hour, minute, second: 0, millisecond: 0 });
    const formattedTime = newDate.toFormat(newDate.minute === 0 ? "h a" : "h:mm a");

    return { extractedTime: formattedTime, newDate };
};
