import type { DynalistCountData, DetermineLabelAndClassesParams } from "../types/dynalist";

/**
 * Returns whether the provided object has an error property.
 * @param {unknown} obj - The object to check for an error property.
 * @returns True if the object has an error property, false otherwise.
 */
export function hasError(obj: unknown): obj is { error: { message?: string } } {
    return typeof obj === "object" && obj !== null && "error" in obj;
}

/**
 * Determines the label and classes based on progress.
 * @param {DetermineLabelAndClassesParams} params - Object containing all necessary parameters.
 * @returns {{ label: string; classes: string }} - Paired button label and classes.
 */
export function determineLabelAndClasses(params: DetermineLabelAndClassesParams): {
    label: string;
    classes: string;
} {
    const { percentageComplete, currentHour, endHour, current, goalCount } = params;

    const conditions = [
        {
            condition: percentageComplete >= 100,
            label: "complete",
            classes: "bg-blue-500 text-blue-100",
        },
        {
            condition: currentHour > endHour && percentageComplete < 100,
            label: "incomplete",
            classes: "",
        },
        {
            condition: percentageComplete === 0,
            label: "ready",
            classes: "bg-neutral text-secondary",
        },
        {
            condition: current >= goalCount * 1.2,
            label: "ahead",
            classes: "bg-purple-500 text-purple-100",
        },
        {
            condition: current <= goalCount * 0.5,
            label: "way behind",
            classes: "bg-orange-500 text-orange-100",
        },
        {
            condition: current <= goalCount * 0.8,
            label: "behind",
            classes: "bg-yellow-600 text-yellow-100",
        },
    ];

    const foundCondition = conditions.find((condition) => condition.condition);
    if (foundCondition) {
        return { label: foundCondition.label, classes: foundCondition.classes };
    }

    return { label: "on track", classes: "bg-green-700 text-green-100" };
}

/**
 * Calculates the label and classes for the current count state.
 * @param {DynalistCountData} countData - An object containing count data.
 * @returns {{ label: string; classes: string }} The label and CSS classes.
 */
export function calculateLabel(countData: DynalistCountData): { label: string; classes: string } {
    const { current, total } = countData;
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

    return determineLabelAndClasses({
        percentageComplete,
        currentHour,
        endHour,
        current,
        goalCount,
    });
}
