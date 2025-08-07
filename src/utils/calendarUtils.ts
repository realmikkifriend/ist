import { DateTime } from "luxon";
import type { Task } from "../types/todoist";
import type { TaskActivity } from "../types/activity";
/**
 * Generates the calendar grid for the current month.
 * @param {DateTime} displayMonthDate - The month to render as a calendar.
 * @returns {(DateTime | null)[]} A grid to display as a calendar month.
 */
export function getCalendarGrid(displayMonthDate: DateTime): (DateTime | null)[] {
    const startOfMonth = displayMonthDate.startOf("month");
    const endOfMonth = displayMonthDate.endOf("month");

    const startDay = startOfMonth.weekday;

    const leadingEmptyDays: null[] = Array.from({ length: startDay - 1 }, () => null);
    const monthDays: DateTime[] = Array.from({ length: endOfMonth.day }, (_, i) =>
        DateTime.local(displayMonthDate.year, displayMonthDate.month, i + 1),
    );

    return [...leadingEmptyDays, ...monthDays] as (DateTime | null)[];
}

/**
 * Processes the day data for dot and tooltip display.
 * @param {DateTime | null} day - The given day for which to retrieve info.
 * @param {Record<string, { dots: { color: string }[]; tasks: Task[] }>} dateInfo - The date information object.
 * @returns {{ dots: { color: string }[]; tasks: Task[] } | null} The info to display.
 */
export function getInfoForDay(
    day: DateTime | null,
    dateInfo: Record<string, { dots: { color: string }[]; tasks: Task[] }>,
): { dots: { color: string }[]; tasks: Task[] } | null {
    if (!day) return null;

    const infos = Object.keys(dateInfo)
        .filter((isoDateTime) => DateTime.fromISO(isoDateTime).hasSame(day, "day"))
        .map((isoDateTime) => dateInfo[isoDateTime]);

    if (infos.length === 0) {
        return null;
    }

    return infos.reduce(
        (acc, info) => {
            acc.dots.push(...info.dots);
            acc.tasks.push(...info.tasks);
            return acc;
        },
        { dots: [], tasks: [] },
    );
}

/**
 * Processes activity data for calendar display.
 * @param {TaskActivity[]} activity - The activity data to process.
 * @returns {Record<string, { dots: { color: string }[]; tasks: Task[] }>} The processed date information.
 */
export function processActivityForCalendar(
    activity: TaskActivity[],
): Record<string, { dots: { color: string }[]; tasks: Task[] }> {
    return activity.reduce(
        (acc, item) => {
            const date = item.date.toISODate();
            if (!date) return acc;

            if (!acc[date]) {
                acc[date] = { dots: [], tasks: [] };
            }
            acc[date].dots.push({ color: "w-8 h-1 bg-blue-500" });
            return acc;
        },
        {} as Record<string, { dots: { color: string }[]; tasks: Task[] }>,
    );
}
