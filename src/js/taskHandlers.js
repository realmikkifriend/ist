import { todoistResources, refreshData, todoistAccessToken, todoistError } from "./stores";
import { markTaskDone } from "./api";

export const handleTaskDone = async (event, setPreviousFirstDueTask, setFirstDueTask) => {
    let accessToken;
    todoistAccessToken.subscribe(($) => {
        accessToken = $;
    });

    if (!accessToken) {
        todoistError.set("No access token found.");
        return;
    }

    todoistResources.update(($resources) => {
        console.log($resources.dueTasks);
        const index = $resources.dueTasks.findIndex((task) => task.id === event.detail.task.id);
        if (index !== -1 && index < $resources.dueTasks.length - 1) {
            setPreviousFirstDueTask($resources.dueTasks[index + 1]);
            setFirstDueTask($resources.dueTasks[index + 1]);
        } else {
            setPreviousFirstDueTask(null);
            setFirstDueTask(null);
        }
        return $resources;
    });

    try {
        await markTaskDone(event.detail.task.id, accessToken);
    } catch (error) {
        todoistError.set(`Failed to mark task done: ${error.message}`);
        return;
    }

    refreshData();
};
