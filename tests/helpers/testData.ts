import type { Task, Context } from "../../types/todoist";

export const sampleContexts: Context[] = [
    {
        id: "c1",
        name: "Work",
        childOrder: 1,
        color: "berry_red",
        inboxProject: false,
        parentId: null,
        viewStyle: "list",
        url: "",
        isDeleted: false,
        updatedAt: null,
        description: "",
        isCollapsed: false,
        canAssignTasks: false,
        createdAt: null,
        isArchived: false,
        isFavorite: false,
        isFrozen: false,
        defaultOrder: 0,
        isShared: false,
    },
    {
        id: "c2",
        name: "Home",
        childOrder: 2,
        color: "berry_red",
        inboxProject: false,
        parentId: null,
        viewStyle: "list",
        url: "",
        isDeleted: false,
        updatedAt: null,
        description: "",
        isCollapsed: false,
        canAssignTasks: false,
        createdAt: null,
        isArchived: false,
        isFavorite: false,
        isFrozen: false,
        defaultOrder: 0,
        isShared: false,
    },
];

type MakeTaskParams = {
    id: number | string;
    due?: Partial<NonNullable<Task["due"]>>;
    priority?: 1 | 2 | 3 | 4;
    contextId?: string;
    content?: string;
};

/**
 * Creates a mock Task object for testing.
 * @param {object} params - Parameters for creating the task.
 * @param {number | string} params.id - The ID of the task to mock.
 * @param {Partial<NonNullable<Task["due"]>>} [params.due] - Partial due date object.
 * @param {1 | 2 | 3 | 4} params.priority - The mocked task's priority.
 * @param {string} params.contextId - The mocked task's context ID.
 * @param {string} params.content - The mocked task's content.
 * @returns {Task} A mock Task object.
 */
export function makeTask({
    id,
    due,
    priority = 1,
    contextId = "c1",
    content = "",
}: MakeTaskParams): Task {
    return {
        id: String(id),
        content,
        due: due
            ? {
                  isRecurring: false,
                  date: due.date ?? "",
                  string: due.string ?? "",
                  datetime: due.datetime ?? null,
                  lang: due.lang ?? null,
                  timezone: due.timezone ?? null,
                  ...due,
              }
            : null,
        priority,
        contextId,
        projectId: contextId,
        url: "",
        labels: [],
    };
}

export const mockTask: Task = {
    id: "1",
    content: "Test Task",
    projectId: "proj1",
    priority: 1,
    url: "",
    due: null,
    labels: [],
    userId: "user1",
    description: "",
    isDeleted: false,
    checked: false,
    noteCount: 0,
    dayOrder: 0,
    isCollapsed: false,
};

export const mockContext: Context = {
    id: "ctx1",
    name: "Context 1",
    url: "",
    parentId: null,
    isDeleted: false,
    updatedAt: null,
    childOrder: 0,
    description: "",
    isCollapsed: false,
    canAssignTasks: false,
    color: "berry_red",
    inboxProject: false,
    viewStyle: "list",
    defaultOrder: 0,
    isShared: false,
    createdAt: null,
    isArchived: false,
    isFavorite: false,
    isFrozen: false,
};
