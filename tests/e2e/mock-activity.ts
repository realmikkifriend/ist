import { DateTime } from "luxon";
import { E2E_PROJECTS } from "./mock-data";

/**
 * Builds a local-noon date a number of days ago, so activity events fall
 * inside the fetched history window on a stable part of the day.
 * @param {number} days - Number of days in the past.
 * @returns {Date} The moment.
 */
export const daysAgoNoon = (days: number): Date =>
    DateTime.now()
        .minus({ days })
        .set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
        .toJSDate();

/**
 * Builds a Todoist wire-format activity-log event for a completed task. Activity
 * events use snake_case keys on the wire (the SDK camel-cases the response), and
 * the mock serves them from its `GET /activities` handler keyed by `object_id`.
 * @param {string} objectId - The completed task id.
 * @param {Date} date - The completion moment.
 * @param {Record<string, unknown>} [overrides] - Wire fields that override the defaults.
 * @returns {Record<string, unknown>} The raw activity event.
 */
export function makeActivityEvent(
    objectId: string,
    date: Date,
    overrides: Record<string, unknown> = {},
): Record<string, unknown> {
    return {
        id: 1,
        object_type: "item",
        object_id: objectId,
        event_type: "completed",
        event_date: date.toISOString(),
        parent_project_id: E2E_PROJECTS.home,
        parent_item_id: null,
        initiator_id: null,
        extra_data: { title: "Completed task" },
        ...overrides,
    };
}
