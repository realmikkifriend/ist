import { get } from "svelte/store";
import { DateTime } from "luxon";
import { todoistResources, todoistAccessToken, todoistError, previousFirstDueTask } from "./stores";
import { markTaskDone, deferTasks, refreshData } from "./api";
import { updateFirstDueTask } from "./first";

const updateTaskResources = (taskUpdates) => {
    todoistResources.update(($resources) => {
        taskUpdates.sort(([_, timeA], [__, timeB]) => new Date(timeA) - new Date(timeB));

        taskUpdates.forEach(([taskID, time]) => {
            const index = $resources.dueTasks.findIndex((task) => task.id === taskID);
            if (index !== -1) {
                const task = $resources.dueTasks[index];
                const prevFirstDueTask = get(previousFirstDueTask);

                const newDueDate = new Date(time);
                task.due.date = newDueDate.toISOString();

                $resources.dueTasks.splice(index, 1);

                if (prevFirstDueTask && index === 0) {
                    previousFirstDueTask.set(null);
                }

                if (newDueDate < new Date()) {
                    const insertIndex = $resources.dueTasks.findIndex(
                        (task) => new Date(task.due.date) > newDueDate,
                    );
                    if (insertIndex === -1) {
                        $resources.dueTasks.push(task);
                    } else {
                        $resources.dueTasks.splice(insertIndex, 0, task);
                    }
                }
            }
        });

        return $resources;
    });

    updateFirstDueTask();
};

export const handleTaskDone = async (taskID) => {
    let accessToken = get(todoistAccessToken);
    previousFirstDueTask.set(null);

    if (!accessToken) {
        todoistError.set("No access token found.");
        throw new Error("No access token found.");
    }

    const fiveMinutesFromNow = DateTime.now().plus({ minutes: 5 });

    updateTaskResources([[taskID, fiveMinutesFromNow]]);

    try {
        await markTaskDone(taskID, accessToken);
    } catch (error) {
        todoistError.set(`Failed to mark task done: ${error.message}`);
        return;
    }

    refreshData();
};

export const handleTaskDefer = async (taskUpdates) => {
    let accessToken = get(todoistAccessToken);
    previousFirstDueTask.set(null);

    const updatedTaskResources = taskUpdates.map(([task, dateTime]) => [task.id, dateTime]);
    updateTaskResources(updatedTaskResources);

    try {
        await deferTasks(taskUpdates, accessToken);
    } catch (error) {
        todoistError.set(`Failed to defer tasks: ${error.message}`);
        return;
    }

    refreshData();
};
