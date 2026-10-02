import { daysAgoNoon, makeActivityEvent } from "./mock-activity";
import { E2E_PROJECTS, makeRoutineTask, makeTask } from "./mock-data";
import { makeScenario } from "./scenarios";

/**
 * Builds a stats scenario: alpha completed 2 and 12 days ago; beta (self-care
 * context) completed 12 days ago; gamma completed 28 days ago (the edge of the
 * initial retrieval window); zeta completed 30 days ago (outside the initial
 * window, inside the extended one); delta and epsilon are never completed.
 * @returns {object} A scenario with completion history for the standard tasks.
 */
export const makeStatsScenario = (): ReturnType<typeof makeScenario> => {
    const base = makeScenario({
        activity: {
            "": [
                makeActivityEvent("task-alpha", daysAgoNoon(2)),
                makeActivityEvent("task-alpha", daysAgoNoon(12)),
                makeActivityEvent("task-beta", daysAgoNoon(12), {
                    parent_project_id: E2E_PROJECTS.selfCare,
                }),
                makeActivityEvent("task-gamma", daysAgoNoon(28)),
                makeActivityEvent("task-zeta", daysAgoNoon(30)),
            ],
        },
    });
    return { ...base, tasks: [...base.tasks, makeTask("task-zeta", "Zeta no date")] };
};

/**
 * Builds the stats scenario plus a never-done routine task: the "never-mark-done"
 * label flags it as neverDone, so it must never appear in the longest-idle list.
 * @returns {object} A stats scenario with an extra never-done routine task.
 */
export const makeStatsScenarioWithNeverDoneTask = (): ReturnType<typeof makeScenario> => {
    const base = makeStatsScenario();
    return { ...base, tasks: [...base.tasks, makeRoutineTask("task-routine", "Routine task")] };
};

/**
 * Builds a scenario whose eleven tasks were each completed once, 1 through 11
 * days ago — enough completions to overflow the longest-idle list's limit.
 * @returns {object} A scenario with eleven once-completed tasks.
 */
export const makeLongestIdleLimitScenario = (): ReturnType<typeof makeScenario> =>
    makeScenario({
        tasks: Array.from({ length: 11 }, (_, i) =>
            makeTask(`task-idle-${i + 1}`, `Idle task ${i + 1}`),
        ),
        activity: {
            "": Array.from({ length: 11 }, (_, i) =>
                makeActivityEvent(`task-idle-${i + 1}`, daysAgoNoon(i + 1)),
            ),
        },
    });
