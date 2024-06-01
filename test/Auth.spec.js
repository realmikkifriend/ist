import { render, screen, cleanup } from "@testing-library/svelte";
import { writable } from "svelte/store";
import { describe, it, expect, vi, afterEach } from "vitest";
import { todoistAccessToken } from "../src/js/stores";
import Auth from "../src/html/Auth.svelte";

vi.mock("../src/js/stores", async () => {
    const actual = await vi.importActual("../src/js/stores");
    return {
        ...actual,
        todoistAccessToken: writable(""),
    };
});

describe("Auth renders landing, handles login, and displays app once logged in", () => {
    afterEach(() => {
        cleanup();
        todoistAccessToken.set("");
        vi.restoreAllMocks();
    });

    it("renders LandingPage if no access token and no code in URL", () => {
        render(Auth);

        expect(screen.getByLabelText("Quick Explanation")).toBeInTheDocument();
    });

    it("renders OAuthCallback if no access token but code in URL", () => {
        Object.defineProperty(window, "location", {
            value: {
                search: "?code=somecode",
            },
        });

        render(Auth);

        expect(screen.getByText("Authenticating...")).toBeInTheDocument();
    });

    it("renders App if there is an access token", () => {
        todoistAccessToken.set("mockAccessToken");
        render(Auth);

        expect(
            screen.getByText("Error loading Todoist data", { exact: false }),
        ).toBeInTheDocument();
    });

    it("redirects to root if there's both a code in the URL and an access token", () => {
        todoistAccessToken.set("mockAccessToken");
        Object.defineProperty(window, "location", {
            value: {
                search: "?code=somecode",
                assign: vi.fn(),
                href: "",
            },
            writable: true,
        });

        render(Auth);

        expect(window.location.href).toBe("/");
    });
});
