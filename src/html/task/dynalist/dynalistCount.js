import { success } from "../../../js/toasts";
import { updateDynalist } from "./dynalistApi";

export const parseCountData = (note) => {
    const match = note.match(/count (\d+)(?:\/(\d+))?\s*(\d{4}-\d{1,2}-\d{1,2})?/);
    const [, total, current, date] =
        match?.map((val) => (val && !isNaN(val) ? parseInt(val) : val)) || [];
    return { total, current, date };
};

export const getAdjustedData = (data, today) => {
    if (data.date !== today) {
        return { ...data, date: today, current: 0 };
    }
    return data;
};

const createUpdatedCountData = (currentData, increment) => ({
    ...currentData,
    current: (+currentData.current || 0) + increment,
});

const createNoteString = (total, current, date) => `count ${total}/${current} ${date}`;

const createApiChanges = (nodeId, noteString) => [
    {
        action: "edit",
        node_id: nodeId,
        note: noteString,
    },
];

export async function handleCount(option, countData, content) {
    const todayFormatted = new Date().toLocaleDateString("en-CA");
    const increment = +option.slice(1);
    const updatedData = createUpdatedCountData(countData, increment);
    const newNote = createNoteString(updatedData.total, updatedData.current, todayFormatted);
    const changes = createApiChanges(content.id, newNote);

    await updateDynalist(content.file_id, changes);

    success("Updated count!");

    return updatedData;
}

export function calculateLabel(countData) {
    const { current, total } = countData;
    const now = new Date();
    const startHour = 8;
    const endHour = 22;
    const totalHours = endHour - startHour;
    const currentHour = now.getHours();

    const calculateGoalCount = (currentHour, startHour, endHour, totalHours, total) => {
        if (currentHour < startHour) return 0;
        if (currentHour > endHour) return total;
        const hoursPassed = currentHour - startHour;
        return (hoursPassed / totalHours) * total;
    };

    const goalCount = calculateGoalCount(currentHour, startHour, endHour, totalHours, total);
    const percentageComplete = (current / total) * 100;

    const determineLabelAndClasses = (
        percentageComplete,
        currentHour,
        endHour,
        current,
        goalCount,
    ) => {
        if (percentageComplete >= 100) {
            return { label: "complete", classes: "bg-blue-500 text-blue-100" };
        } else if (currentHour > endHour && percentageComplete < 100) {
            return { label: "incomplete", classes: "" };
        } else if (percentageComplete === 0) {
            return { label: "ready", classes: "bg-neutral text-secondary" };
        } else if (current >= goalCount * 1.2) {
            return { label: "ahead", classes: "bg-purple-500 text-purple-100" };
        } else if (current <= goalCount * 0.5) {
            return { label: "way behind", classes: "bg-orange-500 text-orange-100" };
        } else if (current <= goalCount * 0.8) {
            return { label: "behind", classes: "bg-yellow-600 text-yellow-100" };
        } else {
            return { label: "on track", classes: "bg-green-700 text-green-100" };
        }
    };

    return determineLabelAndClasses(percentageComplete, currentHour, endHour, current, goalCount);
}
