import { render, screen } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import Footer from "../../src/html/Footer.svelte";

describe("Footer.svelte", () => {
    it("renders static disclaimer text and Github source code link with correct href", () => {
        render(Footer);
        expect(
            screen.getByText(/Ist is not created by, affiliated with, or supported by Doist/i),
        ).toBeInTheDocument();
        expect(screen.getByText(/None of your data is stored/i)).toBeInTheDocument();

        const link = screen.getByRole("link", { name: /source code on Github/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "https://github.com/realmikkifriend/ist/");
        expect(link).toHaveClass("link");
    });
});
