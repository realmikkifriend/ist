import "@testing-library/jest-dom/vitest";

vi.mock("@zerodevx/svelte-toast", () => ({
    toast: () => {},
    SvelteToast: {},
}));
