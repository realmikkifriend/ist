import { vi } from "vitest";
import type { Mock } from "vitest";

const pop: Mock = vi.fn();
const push: Mock = vi.fn(() => 42);

vi.mock("@zerodevx/svelte-toast", () => ({
    toast: {
        pop,
        push,
    },
}));
