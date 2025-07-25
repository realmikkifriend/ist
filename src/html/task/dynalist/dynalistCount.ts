import { success } from "../../../js/toasts";
// @ts-expect-error until file is converted to TypeScript
import { updateDynalist } from "./dynalistApi";

export interface DynalistCountData {
    total?: number;
    current?: number;
    date?: string;
}

export interface DynalistContent {
    id: string;
    file_id: string;
    [key: string]: unknown;
}

/**
 * Parses count data from a Dynalist note string.
 * @param {string} note - The note string to parse.
 * @returns {DynalistCountData} The parsed count data.
 */
export const parseCountData = (note: string): DynalistCountData => {
    const match = note.match(/count (\d+)(?:\/(\d+))?\s*(\d{4}-\d{1,2}-\d{1,2})?/);
    if (!match) return {};
    const [total, current, date] = match.slice(1);
    return {
        total: total !== undefined ? parseInt(total, 10) : undefined,
        current: current !== undefined ? parseInt(current, 10) : undefined,
        date,
    };
};

/**
 * Handles updating the count for a Dynalist node.
 * @param {string} option - The option string (e.g., "+1", "-1").
 * @param {DynalistCountData} countData - The current count data.
 * @param {DynalistContent} content - The Dynalist node content.
 * @returns {Promise<DynalistCountData>} The updated count data.
 */
export async function handleCount(
    option: string,
    countData: DynalistCountData,
    content: DynalistContent,
): Promise<DynalistCountData> {
    const todayFormatted = new Date().toLocaleDateString("en-CA");
    const increment = +option.slice(1);
    const updatedData: DynalistCountData = {
        ...countData,
        current: (countData.current ?? 0) + increment,
    };
    const changes = [
        {
            action: "edit",
            node_id: content.id,
            note: `count ${updatedData.total}/${updatedData.current} ${todayFormatted}`,
        },
    ];

    // eslint-disable-next-line
    await updateDynalist(content.file_id, changes);

    success("Updated count!");

    return updatedData;
}

/**
 * Calculates the label and classes for the current count state.
 * @param {DynalistCountData} countData - An object containing count data.
 * @returns {{ label: string; classes: string }} The label and CSS classes.
 */
export function calculateLabel(countData: DynalistCountData): { label: string; classes: string } {
    const { current = 0, total = 0 } = countData;
    const now = new Date();
    const startHour = 8;
    const endHour = 22;
    const currentHour = now.getHours();

    /**
     * Calculates the goal count based on the current hour.
     * @param {number} currentHour - Hour extracted from current time.
     * @param {number} startHour - Hour set as start of the productive day.
     * @param {number} endHour - Hour set as end of the productive day.
     * @param {number} total - How many tasks to complete.
     * @returns {number} - The calculated goal count.
     */
    const calculateGoalCount = (
        currentHour: number,
        startHour: number,
        endHour: number,
        total: number,
    ): number => {
        const totalHours = endHour - startHour;
        if (currentHour < startHour) return 0;
        if (currentHour > endHour) return total;
        const hoursPassed = currentHour - startHour;
        return (hoursPassed / totalHours) * total;
    };

    const goalCount = calculateGoalCount(currentHour, startHour, endHour, total);
    const percentageComplete = total === 0 ? 0 : (current / total) * 100;

    /**
     * Determines the label and classes based on progress.
     * @param {number} percentageComplete - Completion based on tasks done.
     * @param {number} currentHour - Hour extracted from current time.
     * @param {number} endHour - Hour designated as end of productive day.
     * @param {number} current - Hour designated as end of productive day.
     * @param {number} goalCount - Number of tasks to complete in a day.
     * @returns {{ label: string; classes: string }} - Paired button label and classes.
     */
    const determineLabelAndClasses = (
        percentageComplete: number,
        currentHour: number,
        endHour: number,
        current: number,
        goalCount: number,
    ): { label: string; classes: string } => {
        if (percentageComplete >= 100) {
            return { label: "complete", classes: "bg-blue-500 text-blue-100" };
        } else if (currentHour > endHour && percentageComplete < 100) {
            return { label: "incomplete", classes: "" };
        } else if (percentageComplete === 0) {
            return { label: "ready", classes: "bg-neutral text-secondary" };
        } else if (current >= goalCount * 1.2) {
            return { label: "ahead", classes: "bg-purple-500 text-purple-100" };
        } else if (current <= goalCount * 0.5) {
            return { label: "way behind", classes: "bg-orange-500 text-orange-100" };
        } else if (current <= goalCount * 0.8) {
            return { label: "behind", classes: "bg-yellow-600 text-yellow-100" };
        } else {
            return { label: "on track", classes: "bg-green-700 text-green-100" };
        }
    };

    return determineLabelAndClasses(percentageComplete, currentHour, endHour, current, goalCount);
}
