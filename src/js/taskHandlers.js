import { todoistResources, refreshData } from "./stores";

export const handleTaskDone = (event, setPreviousFirstDueTask, setFirstDueTask) => {
    todoistResources.update(($resources) => {
        const index = $resources.dueTasks.findIndex((task) => task.id === event.detail.task.id);
        if (index !== -1 && index < $resources.dueTasks.length - 1) {
            setPreviousFirstDueTask($resources.dueTasks[index]);
            setFirstDueTask($resources.dueTasks[index + 1]);
        } else {
            setPreviousFirstDueTask(null);
            setFirstDueTask(null);
        }
        return $resources;
    });
    refreshData();
};
