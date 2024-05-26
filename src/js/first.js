import { newFirstTask } from "./toasts";
import FirstDueTaskToast from "../html/FirstDueTaskToast.svelte";

export const checkAndUpdateFirstDueTask = (
    $resources,
    previousFirstDueTask,
    setFirstDueTask,
    setPreviousFirstDueTask,
    selectedContextId = null,
) => {
    let dueTasks = $resources.dueTasks;

    if (selectedContextId) {
        dueTasks = dueTasks.filter((task) => task.context_id === selectedContextId);
    }

    if (!dueTasks || dueTasks.length === 0) return;

    const currentFirstDueTask = dueTasks[0];

    if (currentFirstDueTask?.id === previousFirstDueTask?.id) return;

    if (
        previousFirstDueTask &&
        (selectedContextId === null || previousFirstDueTask.context_id === selectedContextId)
    ) {
        const onClickHandler = () => {
            setFirstDueTask(currentFirstDueTask);
        };
        newFirstTask(FirstDueTaskToast, onClickHandler);
    } else {
        setFirstDueTask(currentFirstDueTask);
    }

    setPreviousFirstDueTask(currentFirstDueTask);
};
