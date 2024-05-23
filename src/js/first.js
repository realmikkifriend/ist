import { toast } from "@zerodevx/svelte-toast";
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
        const toastId = toast.push({
            component: {
                src: FirstDueTaskToast,
                props: {
                    onClick: () => {
                        setFirstDueTask(currentFirstDueTask);
                        toast.pop(toastId);
                    },
                },
            },
            theme: {
                "--toastColor": "white",
                "--toastBackground": "orange",
            },
            initial: 0,
        });
    } else {
        setFirstDueTask(currentFirstDueTask);
    }

    setPreviousFirstDueTask(currentFirstDueTask);
};
