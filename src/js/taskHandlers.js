import { todoistResources, refreshData, todoistAccessToken, todoistError } from "./stores";
import { markTaskDone } from "./api";

export const handleTaskDone = async (taskID, setPreviousFirstDueTask, setFirstDueTask) => {
    let accessToken;
    todoistAccessToken.subscribe(($) => {
        accessToken = $;
    });

    if (!accessToken) {
        todoistError.set("No access token found.");
        return;
    }

    todoistResources.update(($resources) => {
        const index = $resources.dueTasks.findIndex((task) => task.id === taskID);
        if (index !== -1) {
            const task = $resources.dueTasks[index];

            const newDueDate = new Date(task.due.date);
            newDueDate.setMinutes(newDueDate.getMinutes() + 5);
            task.due.date = newDueDate.toISOString();

            $resources.dueTasks.splice(index, 1);

            if ($resources.dueTasks.length > 0) {
                setFirstDueTask($resources.dueTasks[0]);
            } else {
                setFirstDueTask(null);
            }
            setPreviousFirstDueTask(null);
        }

        return $resources;
    });

    try {
        await markTaskDone(taskID, accessToken);
    } catch (error) {
        todoistError.set(`Failed to mark task done: ${error.message}`);
        return;
    }

    refreshData();
};

export const handleTaskDefer = async (task, time, setPreviousFirstDueTask, setFirstDueTask) => {
    // back-end task defer logic goes here
};
