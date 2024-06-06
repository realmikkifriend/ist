import { DateTime } from "luxon";
import { todoistResources, refreshData, todoistAccessToken, todoistError } from "./stores";
import { markTaskDone, deferTask } from "./api";

const getAccessToken = async () => {
    let accessToken;
    todoistAccessToken.subscribe(($) => {
        accessToken = $;
    });

    if (!accessToken) {
        todoistError.set("No access token found.");
        throw new Error("No access token found.");
    }

    return accessToken;
};

const updateTaskResources = (taskID, time, setPreviousFirstDueTask, setFirstDueTask) => {
    todoistResources.update(($resources) => {
        const index = $resources.dueTasks.findIndex((task) => task.id === taskID);
        if (index !== -1) {
            const task = $resources.dueTasks[index];

            const newDueDate = new Date(time);
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
};

export const handleTaskDone = async (taskID, setPreviousFirstDueTask, setFirstDueTask) => {
    let accessToken;
    try {
        accessToken = await getAccessToken();
    } catch (error) {
        return;
    }

    const fiveMinutesFromNow = DateTime.now().plus({ minutes: 5 });

    updateTaskResources(taskID, fiveMinutesFromNow, setPreviousFirstDueTask, setFirstDueTask);

    try {
        await markTaskDone(taskID, accessToken);
    } catch (error) {
        todoistError.set(`Failed to mark task done: ${error.message}`);
        return;
    }

    refreshData();
};

export const handleTaskDefer = async (task, time, setPreviousFirstDueTask, setFirstDueTask) => {
    let accessToken;
    try {
        accessToken = await getAccessToken();
    } catch (error) {
        return;
    }

    updateTaskResources(task.id, time, setPreviousFirstDueTask, setFirstDueTask);

    try {
        await deferTask(task, time, accessToken);
    } catch (error) {
        todoistError.set(`Failed to defer task: ${error.message}`);
        return;
    }

    refreshData();
};
