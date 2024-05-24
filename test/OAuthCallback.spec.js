import { render, screen, cleanup, waitFor } from "@testing-library/svelte";
import { writable } from "svelte/store";
import { describe, it, expect, vi, afterEach } from "vitest";
import { todoistAccessToken } from "../src/js/stores";
import OAuthCallback from "../src/html/OAuthCallback.svelte";

const mockFetchResponse = (data) => {
    return {
        json: () => Promise.resolve(data),
    };
};

vi.mock("../src/js/stores", async () => {
    const actual = await vi.importActual("../src/js/stores");
    return {
        ...actual,
        todoistAccessToken: writable(""),
    };
});

describe("OAuthCallback handles token exchange", () => {
    afterEach(() => {
        cleanup();
        todoistAccessToken.set("");
        vi.restoreAllMocks();
    });

    it("renders 'Authenticating...' if there is a URL code", () => {
        Object.defineProperty(window, "location", {
            value: {
                search: "?code=testCode",
            },
        });
        render(OAuthCallback);
        expect(screen.getByText("Authenticating...")).toBeInTheDocument();
    });

    it("exchanges code for token and sets access token", async () => {
        Object.defineProperty(window, "location", {
            value: {
                search: "?code=testCode",
                assign: vi.fn(),
                href: "",
            },
            writable: true,
        });

        global.fetch = vi.fn().mockResolvedValue(
            mockFetchResponse({
                access_token: "mockAccessToken",
            }),
        );

        vi.spyOn(todoistAccessToken, "set");

        render(OAuthCallback);

        await waitFor(() => {
            expect(todoistAccessToken.set).toHaveBeenCalledWith("mockAccessToken");
        });
        expect(window.location.href).toBe("/");
    });

    it("handles error if token exchange fails", async () => {
        Object.defineProperty(window, "location", {
            value: {
                search: "?code=testCode",
            },
            writable: true,
        });

        global.fetch = vi.fn().mockResolvedValue(
            mockFetchResponse({
                error: "invalid_grant",
            }),
        );

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        render(OAuthCallback);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Failed to exchange code for token", {
                error: "invalid_grant",
            });
        });

        consoleSpy.mockRestore();
    });
});
