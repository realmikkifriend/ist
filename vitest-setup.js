import "@testing-library/jest-dom/vitest";

import { vi } from "vitest";
vi.mock("@zerodevx/svelte-toast", () => ({
    toast: () => {},
    SvelteToast: {},
}));
