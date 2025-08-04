import type { Priority, ColorName } from "../types/todoist.js";
import type { QuarterHourPosition, GradientType } from "../types/agenda.js";
import type { TaskActivity, Context } from "../types/todoist.js";

// This code may appear redundant, but ensures that Svelte exports all necessary classes.

/**
 * Returns background and text color classes for a given priority.
 * @param {Priority} priority - The priority to style.
 * @returns The corresponding Tailwind CSS classes for the priority.
 */
export const getPriorityClasses = (priority: Priority): string =>
    ({
        1: "bg-priority-1 text-white",
        2: "bg-priority-2 text-white",
        3: "bg-priority-3 text-white",
        4: "bg-priority-4 text-white",
    })[priority] || "";

/**
 * Returns the border color class for a given priority.
 * @param {Priority} priority - The priority level (1 to 4).
 * @returns The corresponding Tailwind CSS border class for the priority.
 */
export const getPriorityBorder = (priority: Priority): string =>
    ({
        1: "border-b-priority-1/75",
        2: "border-b-priority-2/75",
        3: "border-b-priority-3/75",
        4: "border-b-priority-4/75",
    })[priority] || "";

export const colorClasses: Record<ColorName, string> = {
    berry_red: "bg-red-500",
    red: "bg-red-700",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
    olive_green: "bg-lime-700",
    lime_green: "bg-lime-500",
    green: "bg-green-600",
    mint_green: "bg-emerald-400",
    teal: "bg-teal-600",
    sky_blue: "bg-sky-400",
    light_blue: "bg-blue-300",
    blue: "bg-blue-500",
    grape: "bg-purple-500",
    violet: "bg-violet-600",
    lavender: "bg-purple-300",
    magenta: "bg-pink-600",
    salmon: "bg-rose-400",
    charcoal: "bg-slate-600",
    grey: "bg-gray-400",
    taupe: "bg-red-100",
};

export const colorClassesFaded: Record<ColorName, string> = {
    berry_red: "bg-red-500/50",
    red: "bg-red-700/50",
    orange: "bg-orange-500/50",
    yellow: "bg-yellow-500/50",
    olive_green: "bg-lime-700/50",
    lime_green: "bg-lime-500/50",
    green: "bg-green-600/50",
    mint_green: "bg-emerald-400/50",
    teal: "bg-teal-600/50",
    sky_blue: "bg-sky-400/50",
    light_blue: "bg-blue-300/50",
    blue: "bg-blue-500/50",
    grape: "bg-purple-500/50",
    violet: "bg-violet-600/50",
    lavender: "bg-purple-300/50",
    magenta: "bg-pink-600/50",
    salmon: "bg-rose-400/50",
    charcoal: "bg-slate-600/50",
    grey: "bg-gray-400/50",
    taupe: "bg-red-100/50",
};

export const borderClasses: Record<ColorName, string> = {
    berry_red: "border-red-500",
    red: "border-red-700",
    orange: "border-orange-500",
    yellow: "border-yellow-500",
    olive_green: "border-lime-700",
    lime_green: "border-lime-500",
    green: "border-green-600",
    mint_green: "border-emerald-400",
    teal: "border-teal-600",
    sky_blue: "border-sky-400",
    light_blue: "border-blue-300",
    blue: "border-blue-500",
    grape: "border-purple-500",
    violet: "border-violet-600",
    lavender: "border-purple-300",
    magenta: "border-pink-600",
    salmon: "border-rose-400",
    charcoal: "border-slate-600",
    grey: "border-gray-400",
    taupe: "border-red-100",
};

/**
 * Returns the CSS class for positioning an element based on a quarter hour.
 * @param {QuarterHourPosition} position - The quarter hour position (0.25, 0.5, or 0.75).
 * @returns The corresponding Tailwind CSS top position class.
 */
export const getQuarterHourPosition = (position: QuarterHourPosition): string =>
    ({
        0.25: "top-[25%]",
        0.5: "top-[50%]",
        0.75: "top-[75%]",
    })[position] || "";

function getTomorrowGradient(
    totalTasks: number,
    gradients: Record<GradientType, string>,
): string | null {
    const thresholds = [
        { limit: 21, color: gradients.red },
        { limit: 19, color: gradients.orange },
        { limit: 17, color: null },
        { limit: 15, color: gradients.darkGreen },
        { limit: 12, color: gradients.green },
    ];

    const found = thresholds.find(({ limit }) => totalTasks >= limit);
    return found ? found.color : gradients.blue;
}

function getTodayGradient(
    totalTasks: number,
    gradients: Record<GradientType, string>,
): string | null {
    const currentHour = new Date().getHours();
    const hourAdjustment = Math.max(0, currentHour - 8);
    const todayThreshold = 14 - hourAdjustment;
    const diff = totalTasks - todayThreshold;

    if (diff < -2) return gradients.blue;
    if (diff > 1) return gradients.red;

    const diffMap: Map<number, string | null> = new Map([
        [-2, gradients.green],
        [-1, gradients.darkGreen],
        [0, null],
        [1, gradients.orange],
    ]);

    return diffMap.get(diff) ?? "";
}

/**
 * Determines a gradient background class based on the total number of tasks and a hash string.
 * @param {number} totalTasks - The total number of tasks.
 * @param {string} hash - The hash string, e.g., "#today", "#tomorrow", or others.
 * @returns The gradient CSS class string, null, or an empty string depending on conditions.
 */
export function getGradientColor(totalTasks: number, hash: string): string | null {
    if (totalTasks === 0) {
        return null;
    }

    const gradients: Record<GradientType, string> = {
        blue: "bg-linear-to-r from-blue-900 to-blue-700",
        green: "bg-linear-to-r from-green-900 to-green-700",
        darkGreen: "bg-linear-to-r from-emerald-900 to-emerald-700",
        orange: "bg-linear-to-r from-orange-800 to-orange-600",
        red: "bg-linear-to-r from-red-900 to-red-700",
    };

    const gradientStrategies: Record<string, () => string | null> = {
        "#tomorrow": () => getTomorrowGradient(totalTasks, gradients),
        "#today": () => getTodayGradient(totalTasks, gradients),
    };

    const strategy = gradientStrategies[hash];
    return strategy ? strategy() : "";
}

/**
 * Retrieves styling for completed tasks.
 * @param {TaskActivity[]} activities - Activity log to parse for styling.
 * @param {Context[]} contexts - Contexts by which to retrieve styles.
 * @returns Tailwind classes to style task activity.
 */
export function getContextColors(activities: TaskActivity[], contexts: Context[]): string[] {
    if (!activities || !contexts) {
        return [];
    }

    const contextMap = new Map(contexts.map((context) => [context.id, context]));

    return activities.map((activity) => {
        const context = contextMap.get(activity.contextId);
        return context ? colorClasses[context.color as ColorName] : "";
    });
}

/**
 * Gets the color for a given context ID.
 * @param {string} id - ID of given context.
 * @param {Context[]} contexts - List of contexts from which to retrieve color.
 * @returns ColorName corresponding to given context, or undefined.
 */
export function getTaskColor(id: string, contexts: Context[]): ColorName | undefined {
    if (!id) return undefined;
    const context: Context | undefined = contexts.find((context) => context.id === id);
    return context?.color as ColorName | undefined;
}
