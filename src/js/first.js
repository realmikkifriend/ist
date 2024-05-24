import { newFirstTask } from "./toasts";
import FirstDueTaskToast from "../html/FirstDueTaskToast.svelte";

export const checkAndUpdateFirstDueTask = (
    $resources,
    previousFirstDueTask,
    setFirstDueTask,
    setPreviousFirstDueTask,
) => {
    if (!$resources.dueTasks || $resources.dueTasks.length === 0) return;

    const currentFirstDueTask = $resources.dueTasks[0];

    if (currentFirstDueTask?.id === previousFirstDueTask?.id) return;

    if (previousFirstDueTask) {
        const onClickHandler = () => {
            setFirstDueTask(currentFirstDueTask);
        };
        newFirstTask(FirstDueTaskToast, onClickHandler);
    } else {
        setFirstDueTask(currentFirstDueTask);
    }

    setPreviousFirstDueTask(currentFirstDueTask);
};
