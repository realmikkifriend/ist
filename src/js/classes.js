// This code may appear redundant, but ensures that Svelte exports all necessary classes.

const priorityClasses = {
    1: "bg-priority-1 text-white",
    2: "bg-priority-2 text-white",
    3: "bg-priority-3 text-white",
    4: "bg-priority-4 text-white",
};

export const getPriorityClasses = (priority) => {
    return priorityClasses[priority] || "";
};

const priorityBorders = {
    1: "border-b-priority-1",
    2: "border-b-priority-2",
    3: "border-b-priority-3",
    4: "border-b-priority-4",
};

export const getPriorityBorder = (priority) => {
    return priorityBorders[priority] || "";
};

export const colorClasses = {
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

export const borderClasses = {
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

const positionClasses = {
    0.25: "top-[25%]",
    0.5: "top-[50%]",
    0.75: "top-[75%]",
};

export function getQuarterHourPosition(position) {
    return positionClasses[position] || "";
}
