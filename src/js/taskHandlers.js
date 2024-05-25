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
        const index = $resources.dueTasks.findIndex((task) => task.id === event.detail.task.id);
        if (index !== -1) {
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
        await markTaskDone(event.detail.task.id, accessToken);
    } catch (error) {
        todoistError.set(`Failed to mark task done: ${error.message}`);
        return;
    }

    refreshData();
};
