export function filterAndSortDueTasks(tasks) {
    let dueTasks = tasks.filter((task) => {
        if (!task.due) {
            return false;
        }
        task.due.all_day = task.due.datetime ? 0 : 1;
        task.due.date_object = new Date(task.due.datetime || task.due.date);
        return task.due.date_object < new Date();
    });

    dueTasks.sort((a, b) => {
        const dateA = new Date(a.due.datetime || a.due.date);
        const dateB = new Date(b.due.datetime || b.due.date);
        return dateA - dateB;
    });

    return dueTasks;
}
