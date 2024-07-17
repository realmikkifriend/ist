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
