import type { Priority, ColorName } from "../../types/todoist.js";
import type { QuarterHourPosition, GradientType } from "../../types/agenda.js";
import type { TaskActivity, Context } from "../../types/todoist.js";

// This code may appear redundant, but ensures that Svelte exports all necessary classes.

/**
 * Returns background and text color classes for a given priority.
 * @param {Priority} priority - The priority level (1 to 4).
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
 * Returns the 'grid-cols-' class for the provided number.
 * @param {number} num - The number of columns.
 * @returns The corresponding Tailwind CSS grid-cols class.
 */
export const getGridColsClass = (num: number): string => {
    const classes: Record<number, string> = {
        1: "grid-cols-1",
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
        5: "grid-cols-5",
        6: "grid-cols-6",
        7: "grid-cols-7",
        8: "grid-cols-8",
        9: "grid-cols-9",
        10: "grid-cols-10",
        11: "grid-cols-11",
        12: "grid-cols-12",
        13: "grid-cols-[13]",
        14: "grid-cols-[14]",
        15: "grid-cols-[15]",
        16: "grid-cols-[16]",
        17: "grid-cols-[17]",
        18: "grid-cols-[18]",
        19: "grid-cols-[19]",
        20: "grid-cols-[20]",
    };

    return classes[num] || "grid-cols-7";
};

/**
 * Returns the border color class for a given priority.
 * @param {Priority} priority - The priority level (1 to 4).
 * @returns The corresponding Tailwind CSS border class for the priority.
 */
export const getPriorityBorder = (priority: Priority): string =>
    ({
        1: "border-b-priority-1",
        2: "border-b-priority-2",
        3: "border-b-priority-3",
        4: "border-b-priority-4",
    })[priority] || "";

export const colorClasses: Record<ColorName, string> = {
    berry_red: "bg-pink-600",
    red: "bg-red-500",
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
    grape: "bg-violet-500",
    violet: "bg-fuchsia-600",
    lavender: "bg-pink-300",
    magenta: "bg-pink-500",
    salmon: "bg-rose-400",
    charcoal: "bg-gray-600",
    grey: "bg-gray-400",
    taupe: "bg-red-100",
};

export const borderClasses: Record<ColorName, string> = {
    berry_red: "border-pink-600",
    red: "border-red-500",
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
    grape: "border-violet-500",
    violet: "border-fuchsia-600",
    lavender: "border-pink-300",
    magenta: "border-pink-500",
    salmon: "border-rose-400",
    charcoal: "border-gray-600",
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

/**
 * Determines a gradient background class based on the total number of tasks and a hash string.
 * @param {number} totalTasks - The total number of tasks.
 * @param {string} hash - The hash string, e.g., "#today", "#tomorrow", or others.
 * @returns The gradient CSS class string, null, or an empty string depending on conditions.
 */
export function getGradientColor(totalTasks: number, hash: string): string | null {
    const gradients: Record<GradientType, string> = {
        blue: "bg-gradient-to-r from-blue-900 to-blue-700",
        green: "bg-gradient-to-r from-green-900 to-green-700",
        darkGreen: "bg-gradient-to-r from-emerald-900 to-emerald-700",
        orange: "bg-gradient-to-r from-orange-800 to-orange-600",
        red: "bg-gradient-to-r from-red-900 to-red-700",
    };

    if (hash === "#tomorrow") {
        switch (true) {
            case totalTasks > 20:
                return gradients.red;
            case totalTasks >= 19:
                return gradients.orange;
            case totalTasks >= 17:
                return null;
            case totalTasks >= 15:
                return gradients.darkGreen;
            case totalTasks >= 12:
                return gradients.green;
            case totalTasks < 12:
                return gradients.blue;
            default:
                return null;
        }
    } else if (hash === "#today") {
        const currentHour: number = new Date().getHours();
        const hourAdjustment: number = currentHour > 8 ? currentHour - 8 : 0;
        const todayThreshold: number = 14 - hourAdjustment;

        if (totalTasks < todayThreshold - 2) {
            return gradients.blue;
        } else if (totalTasks === todayThreshold - 2) {
            return gradients.green;
        } else if (totalTasks === todayThreshold - 1) {
            return gradients.darkGreen;
        } else if (totalTasks === todayThreshold) {
            return null;
        } else if (totalTasks === todayThreshold + 1) {
            return gradients.orange;
        } else if (totalTasks > todayThreshold + 1) {
            return gradients.red;
        } else {
            return "";
        }
    } else {
        return "";
    }
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

    return activities.map((activity) => {
        const context = contexts.find((context) => context.id === activity.contextId);
        return context ? colorClasses[context.color as ColorName] : "";
    });
}
