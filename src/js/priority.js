export const priorityClasses = {
    1: "bg-priority-1 text-white",
    2: "bg-priority-2 text-white",
    3: "bg-priority-3 text-white",
    4: "bg-priority-4 text-white",
};

export const getPriorityClass = (priority) => {
    return priorityClasses[priority] || "";
};
