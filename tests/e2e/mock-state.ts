/**
 * Pure state-update functions for the e2e Todoist mock (`tests/e2e/mock.ts`):
 * they fold recorded API requests into the mutable wire-format state.
 */

/**
 * Applies a wire-format task update (due date fields) to a raw task.
 * @param {Record<string, unknown>} task - The raw task to update.
 * @param {Record<string, unknown>} body - The snake_case update body sent to the API.
 * @returns {Record<string, unknown>} The updated raw task.
 */
export function applyTaskUpdate(
    task: Record<string, unknown>,
    body: Record<string, unknown>,
): Record<string, unknown> {
    const due = (task.due ?? {}) as Record<string, unknown>;
    return {
        ...task,
        due: {
            ...due,
            ...(typeof body.due_string === "string" ? { string: body.due_string } : {}),
            ...(typeof body.due_date === "string" ? { date: body.due_date, datetime: null } : {}),
            ...(typeof body.due_datetime === "string"
                ? { date: body.due_datetime.slice(0, 10), datetime: body.due_datetime }
                : {}),
        },
    };
}

/**
 * Applies a raw `POST /sync` body to the mock's served projects: `project_reorder`
 * commands update each project's `child_order` (like the live API would persist
 * them), so a later projects fetch serves the new context order.
 * @param {Record<string, unknown>[]} projects - The projects currently served.
 * @param {Record<string, unknown>} body - The raw `POST /sync` body.
 * @returns {Record<string, unknown>[]} The updated projects (or the input unchanged).
 */
export function applySyncCommands(
    projects: Record<string, unknown>[],
    body: Record<string, unknown>,
): Record<string, unknown>[] {
    const commands = (body.commands ?? []) as Array<Record<string, unknown>>;
    const reorder = commands.find((command) => command.type === "project_reorder");
    if (!reorder) {
        return projects;
    }

    const entries = ((reorder.args as Record<string, unknown>)?.projects ?? []) as Array<
        Record<string, unknown>
    >;

    return projects.map((project) => {
        const entry = entries.find((move) => move.id === project.id);
        return entry ? { ...project, child_order: entry.child_order } : project;
    });
}
