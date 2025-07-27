import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import { get } from "svelte/store";
import { dynalistAccessToken } from "../../src/js/stores";
import {
    fetchDynalistDocument,
    updateDynalist,
    validateDynalistToken,
} from "../../src/html/task/dynalist/dynalistApi";

vi.mock("svelte/store", async (importOriginal) => {
    const mod = await importOriginal<typeof import("svelte/store")>();
    return {
        ...mod,
        get: vi.fn(),
    };
});

vi.mock("../../src/js/stores", async (importOriginal) => {
    const mod = await importOriginal<typeof import("../../src/js/stores")>();
    const mockDynalistAccessToken = {
        subscribe: vi.fn((cb) => {
            cb("mock-access-token");
            return () => {};
        }),
        set: vi.fn(),
        update: vi.fn(),
        get: vi.fn().mockReturnValue("mock-access-token"),
    };
    return {
        ...mod,
        dynalistAccessToken: mockDynalistAccessToken,
    };
});

interface MockResponse extends Partial<Response> {
    ok: boolean;
    json: () => Promise<any>;
    statusText?: string;
}

describe("dynalistApi", () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        fetchSpy = vi.spyOn(globalThis, "fetch") as ReturnType<typeof vi.spyOn>;

        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("fetchDynalistDocument", () => {
        const mockUrl = "https://dynalist.io/d/file_id_123#z=sub_item_456";
        const mockUrlNoHash = "https://dynalist.io/d/file_id_123";
        const mockAccessToken = "mock-access-token";

        const mockSuccessData = {
            _code: "Ok",
            file_id: "file_id_123",
            content: [{ id: "root", content: "Test Document" }],
        };

        it("fetches a document successfully with sub-item", async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSuccessData),
            } as MockResponse);

            const result = await fetchDynalistDocument(mockUrl, mockAccessToken);

            expect(fetchSpy).toHaveBeenCalledWith("https://dynalist.io/api/v1/doc/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: mockAccessToken, file_id: "file_id_123" }),
            });
            expect(result).toEqual({ data: mockSuccessData, dynalistSubItem: "sub_item_456" });
        });

        it("fetches a document successfully without sub-item", async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSuccessData),
            } as MockResponse);

            const result = await fetchDynalistDocument(mockUrlNoHash, mockAccessToken);

            expect(fetchSpy).toHaveBeenCalledWith("https://dynalist.io/api/v1/doc/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: mockAccessToken, file_id: "file_id_123" }),
            });
            expect(result).toEqual({ data: mockSuccessData, dynalistSubItem: undefined });
        });

        it("returns an error if JSON parsing fails", async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.reject(new Error("Invalid JSON")),
            } as MockResponse);

            const result = await fetchDynalistDocument(mockUrl, mockAccessToken);

            expect(result).toEqual({
                error: "Failed to parse Dynalist response as JSON",
                jsonError: true,
            });
        });

        it("returns an error for NotFound API response", async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: false,
                statusText: "Not Found",
                json: () => Promise.resolve({ _code: "NotFound", _msg: "Document not found" }),
            } as MockResponse);

            const result = await fetchDynalistDocument(mockUrl, mockAccessToken);

            expect(result).toEqual({ error: "Not Found", data: null });
        });

        it("returns a generic error for non-OK response without specific _code", async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: false,
                statusText: "Internal Server Error",
                json: () => Promise.resolve({}),
            } as MockResponse);

            const result = await fetchDynalistDocument(mockUrl, mockAccessToken);

            expect(result).toEqual({ error: "Internal Server Error", data: null });
        });

        it("returns an error for network issues", async () => {
            fetchSpy.mockRejectedValueOnce(new Error("Network down"));

            const result = await fetchDynalistDocument(mockUrl, mockAccessToken);

            expect(result).toEqual({ error: "Network down" });
        });
    });

    describe("updateDynalist", () => {
        const mockFileId = "mock-file-id";
        const mockChanges = [{ action: "insert", parent_id: "root", content: "New item" }];
        const mockAccessToken = "mock-access-token";

        it("updates a document successfully", async () => {
            const mockResponseData = { _code: "Ok" };
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponseData),
            } as MockResponse);
            (get as Mock<typeof get>).mockReturnValue(mockAccessToken);

            const result = await updateDynalist(mockFileId, mockChanges);

            expect(get).toHaveBeenCalledWith(dynalistAccessToken);
            expect(fetchSpy).toHaveBeenCalledWith("https://dynalist.io/api/v1/doc/edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: mockAccessToken,
                    file_id: mockFileId,
                    changes: mockChanges,
                }),
            });
            expect(result).toEqual({ data: mockResponseData });
        });

        it("returns an error if network response is not ok", async () => {
            const mockErrorData = { _code: "Error", message: "Failed to update" };
            fetchSpy.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve(mockErrorData),
            } as MockResponse);
            (get as Mock<typeof get>).mockReturnValue(mockAccessToken);

            const result = await updateDynalist(mockFileId, mockChanges);

            expect(result).toEqual({ error: "Network response was not ok", data: mockErrorData });
        });

        it("returns an error for network issues", async () => {
            fetchSpy.mockRejectedValueOnce(new Error("Update failed"));
            (get as Mock<typeof get>).mockReturnValue(mockAccessToken);

            const result = await updateDynalist(mockFileId, mockChanges);

            expect(result).toEqual({ error: "Failed to parse Dynalist response as JSON" });
        });
    });

    describe("validateDynalistToken", () => {
        it("returns success for a valid token", async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ _code: "Ok", inbox_location: "some_id" }),
            } as MockResponse);

            const result = await validateDynalistToken("valid_token_123");

            expect(fetchSpy).toHaveBeenCalledWith("https://dynalist.io/api/v1/pref/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: "valid_token_123", key: "inbox_location" }),
            });
            expect(result).toEqual({ success: true });
        });

        it("returns error for invalid token format", async () => {
            const result = await validateDynalistToken("invalid-token!");

            expect(fetchSpy).not.toHaveBeenCalled();
            expect(result).toEqual({ success: false, error: "Invalid token format" });
        });

        it("returns error when API indicates invalid token", async () => {
            const mockErrorData = { _code: "InvalidToken", _msg: "Token is invalid" };
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockErrorData),
            } as MockResponse);

            const result = await validateDynalistToken("valid_token_but_api_says_no");

            expect(result).toEqual({ success: false, error: "Invalid token", data: mockErrorData });
        });

        it("returns error for network issues", async () => {
            fetchSpy.mockRejectedValueOnce(new Error("Network error during validation"));

            const result = await validateDynalistToken("some_token");

            expect(result).toEqual({ success: false, error: "Network or other error" });
        });

        it("returns error for non-ok response from API", async () => {
            const mockErrorData = { message: "Server error" };
            fetchSpy.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve(mockErrorData),
            } as MockResponse);

            const result = await validateDynalistToken("some_token");

            expect(result).toEqual({ success: false, error: "Invalid token", data: mockErrorData });
        });
    });
});
