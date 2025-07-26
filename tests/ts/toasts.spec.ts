import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import type { ToastConfig } from "../../types/interface";
import type { SvelteComponent } from "svelte";

vi.mock("@zerodevx/svelte-toast", () => {
    const pop: Mock = vi.fn();
    const push: Mock = vi.fn(() => 42);
    return {
        toast: {
            pop,
            push,
        },
    };
});

import { toast } from "@zerodevx/svelte-toast";
import { success, error, newFirstTask } from "../../src/js/toasts";

describe("toasts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("success", () => {
        it("calls toast.pop with target 'success' and toast.push with correct config", () => {
            const message = "Success!";
            const toastId = success(message);

            expect(toast.pop).toHaveBeenCalledWith({ target: "success" });

            expect(toast.push).toHaveBeenCalledWith(
                message,
                expect.objectContaining({
                    theme: expect.objectContaining({
                        "--toastBarHeight": 0,
                        "--toastColor": "mintcream",
                        "--toastBackground": "rgba(72,187,120,0.9)",
                    }) as Record<string, unknown>,
                    duration: 1000,
                    dismissable: false,
                    target: "success",
                    intro: expect.objectContaining({
                        x: 16000,
                    }) as Record<string, unknown>,
                }),
            );

            expect(toastId).toBe(42);
        });
    });

    describe("error", () => {
        it("calls toast.push with error config", () => {
            const message = "Error!";
            const toastId = error(message);

            expect(toast.push).toHaveBeenCalledWith(
                message,
                expect.objectContaining({
                    theme: expect.objectContaining({
                        "--toastBarHeight": 0,
                        "--toastColor": "white",
                        "--toastBackground": "rgba(255, 0, 0, 0.8)",
                    }) as Record<string, unknown>,
                    initial: 0,
                    dismissable: true,
                    target: "error",
                }),
            );

            expect(toastId).toBe(42);
        });
    });

    describe("newFirstTask", () => {
        const MockComponent = {
            prototype: {},
        } as unknown as typeof SvelteComponent;

        const capturedConfig: { value: ToastConfig | undefined } = { value: undefined };

        beforeEach(() => {
            capturedConfig.value = undefined;
            (toast.push as Mock).mockImplementation((config: ToastConfig) => {
                capturedConfig.value = config;
                return 99;
            });
        });

        it("calls toast.pop with target 'wait' and toast.push with correct config (single argument)", () => {
            const onClickHandler = vi.fn();

            const toastId = newFirstTask(MockComponent, onClickHandler);

            expect(toast.pop).toHaveBeenCalledWith({ target: "wait" });

            expect(toast.push).toHaveBeenCalledWith(
                expect.objectContaining({
                    component: expect.objectContaining({
                        src: MockComponent,
                        props: expect.objectContaining({}) as Record<string, unknown>,
                    }) as unknown as Record<string, unknown>,
                    theme: expect.objectContaining({
                        "--toastColor": "white",
                        "--toastBackground": "orange",
                    }) as Record<string, unknown>,
                    initial: 0,
                    target: "wait",
                }) as Record<string, unknown>,
            );

            expect(toastId).toBe(99);

            expect(toast.push as Mock).toHaveBeenCalled();

            if (capturedConfig.value) {
                const config = capturedConfig.value;
                if (
                    config.component &&
                    typeof config.component === "object" &&
                    config.component !== null &&
                    "props" in config.component &&
                    config.component.props &&
                    typeof config.component.props === "object" &&
                    "onClick" in config.component.props
                ) {
                    const onClick = (config.component.props as { onClick: unknown }).onClick;
                    expect(typeof onClick).toBe("function");
                    (onClick as () => void)();
                    expect(onClickHandler).toHaveBeenCalled();
                    expect(toast.pop).toHaveBeenCalledWith(99);
                } else {
                    throw new Error("onClick handler not found in component config");
                }
            } else {
                throw new Error(
                    "capturedConfig is undefined (toast.push was not called or did not set the config)",
                );
            }
        });
    });
});
