import type { AgendaData, GradientType } from "../types/agenda";
import { getAgendaTaskCount } from "./agendaUtils";

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
function getGradientColor(totalTasks: number, hash: string): string | null {
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
 * Computes the header gradient color based on the number of tasks and the current hash.
 * @param {AgendaData} agendaData - Information on tasks for calculations.
 * @param {string} title - The title of the agenda.
 * @returns Tailwind classes of header gradient.
 */
export function computeHeaderGradientColor(agendaData: AgendaData, title: string): string {
    const currentHash = title ? `#${title.toLowerCase()}` : "";
    const totalTasks = getAgendaTaskCount(agendaData, currentHash);
    return getGradientColor(totalTasks, currentHash ?? "") ?? "";
}
