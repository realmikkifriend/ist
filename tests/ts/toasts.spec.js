import { describe, it, expect } from "vitest";
// import { success, error, newFirstTask } from "../../src/js/toasts";

describe("toasts", () => {
    describe("success", () => {
        it("calls toast.pop with target 'success' and toast.push with correct config", () => {
            expect("test").toBe("written");
        });
    });

    describe("error", () => {
        it("calls toast.push with error config", () => {
            expect("test").toBe("written");
        });
    });

    describe("newFirstTask", () => {
        it("calls toast.pop with target 'wait' and toast.push with component config", () => {
            expect("test").toBe("written");
        });
    });
});
