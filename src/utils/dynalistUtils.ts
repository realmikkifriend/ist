import type { DynalistNode, DynalistDocumentData, DynalistCountData } from "../types/dynalist";

/**
 * Recursively processes a Dynalist node, filtering out checked nodes and processing children.
 * @param {DynalistNode} node - The node to process.
 * @param {DynalistDocumentData} data - The document data containing all nodes.
 * @returns {DynalistNode | null} The processed node or null if checked.
 */
export function processNode(node: DynalistNode, data: DynalistDocumentData): DynalistNode | null {
    if (node.checked) return null;

    const { children, ...rest } = node;
    const processedNode: DynalistNode = {
        ...rest,
        note: node.note,
        content: node.content,
        checked: node.checked,
        children: undefined,
    };

    if (children && children.length > 0) {
        processedNode.children = children
            .map((childId) => {
                const child = data.nodes.find((n) => n.id === childId);
                return child ? processNode(child, data) : null;
            })
            .filter((child): child is DynalistNode => child !== null);
    }

    return processedNode;
}

/**
 * Determines the Dynalist type from a note string.
 * @param {string | undefined} note - The note to analyze.
 * @returns {string} The determined type.
 */
export function getDynalistType(note: string | undefined): string {
    const validTypes = ["read", "checklist", "rotating", "crossoff"];
    const firstWordMatch = note && note.match(/^count \d+(\/|$)[\s\S]*$/);

    if (note && (validTypes.includes(note) || firstWordMatch)) {
        return firstWordMatch ? "count" : note;
    }
    return "read";
}

/**
 * Generates a markdown comment from a Dynalist node and its children.
 * @param {DynalistNode} node - The root node.
 * @param {number} indent - The indentation level.
 * @returns {string} The generated markdown comment.
 */
export function generateDynalistComment(node: DynalistNode, indent: number = 0): string {
    if (!node || !Array.isArray(node.children)) return "";

    const processNodeContent = (child: DynalistNode | string, level: number): string => {
        if (typeof child === "string") {
            return `${"  ".repeat(level)}- ${child}\n`;
        } else {
            const markdown =
                `${"  ".repeat(level)}- ${child.content}\n` +
                (Array.isArray(child.children)
                    ? child.children
                          .map((subChild) => processNodeContent(subChild, level + 1))
                          .join("")
                    : "");
            return markdown;
        }
    };

    return node.children.map((child) => processNodeContent(child, indent)).join("");
}

/**
 * Parses a markdown list into an array of strings, preserving indentation.
 * @param {string} content - The markdown list content.
 * @returns {string[]} The parsed list items.
 */
export function parseList(content: string): string[] {
    return content.split("\n").reduce<string[]>((result, line) => {
        if (line.startsWith("  ") && result.length > 0) {
            result[result.length - 1] += "\n" + line;
        } else {
            result.push(line.substring(2).trim());
        }
        return result;
    }, []);
}

/**
 * Returns whether the provided object has an error property.
 * @param {unknown} obj - The object to check for an error property.
 * @returns True if the object has an error property, false otherwise.
 */
export function hasError(obj: unknown): obj is { error: { message?: string } } {
    return typeof obj === "object" && obj !== null && "error" in obj;
}

/**
 * Parses count data from a Dynalist note string.
 * @param {string} note - The note string to parse.
 * @returns {DynalistCountData} The parsed count data.
 */
export const parseCountData = (note: string): DynalistCountData => {
    const match = note.match(/count (\d+)(?:\/(\d+))?\s*(\d{4}-\d{1,2}-\d{1,2})?/);
    if (!match) {
        return { total: 0, current: 0 };
    }
    const [totalStr, currentStr, date] = match.slice(1);
    const total = totalStr !== undefined ? parseInt(totalStr, 10) : 0;
    const current = currentStr !== undefined ? parseInt(currentStr, 10) : 0;
    return {
        total,
        current,
        ...(date ? { date } : {}),
    };
};

/**
 * Calculates the label and classes for the current count state.
 * @param {DynalistCountData} countData - An object containing count data.
 * @returns {{ label: string; classes: string }} The label and CSS classes.
 */
export function calculateLabel(countData: DynalistCountData): { label: string; classes: string } {
    const { current, total } = countData;
    const now = new Date();
    const startHour = 8;
    const endHour = 22;
    const currentHour = now.getHours();

    /**
     * Calculates the goal count based on the current hour.
     * @param {number} currentHour - Hour extracted from current time.
     * @param {number} startHour - Hour set as start of the productive day.
     * @param {number} endHour - Hour set as end of the productive day.
     * @param {number} total - How many tasks to complete.
     * @returns {number} - The calculated goal count.
     */
    const calculateGoalCount = (
        currentHour: number,
        startHour: number,
        endHour: number,
        total: number,
    ): number => {
        const totalHours = endHour - startHour;
        if (currentHour < startHour) return 0;
        if (currentHour > endHour) return total;
        const hoursPassed = currentHour - startHour;
        return (hoursPassed / totalHours) * total;
    };

    const goalCount = calculateGoalCount(currentHour, startHour, endHour, total);
    const percentageComplete = total === 0 ? 0 : (current / total) * 100;

    /**
     * Determines the label and classes based on progress.
     * @param {number} percentageComplete - Completion based on tasks done.
     * @param {number} currentHour - Hour extracted from current time.
     * @param {number} endHour - Hour designated as end of productive day.
     * @param {number} current - Hour designated as end of productive day.
     * @param {number} goalCount - Number of tasks to complete in a day.
     * @returns {{ label: string; classes: string }} - Paired button label and classes.
     */
    const determineLabelAndClasses = (
        percentageComplete: number,
        currentHour: number,
        endHour: number,
        current: number,
        goalCount: number,
    ): { label: string; classes: string } => {
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
