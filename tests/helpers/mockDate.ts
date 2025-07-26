import { vi, type MockInstance } from "vitest";

let getHoursSpy: MockInstance<() => number> | null = null;

/**
 * Mocks date for tests.
 * @param {Date} now - The provided date object.
 * @param {number} [mockedLocalHour] - Optional hour to return for getHours().
 * @returns The original Date constructor.
 */
export function mockDate(now: Date, mockedLocalHour?: number) {
    const OriginalDate = globalThis.Date;

    if (mockedLocalHour !== undefined) {
        now.setHours(mockedLocalHour);
        getHoursSpy = vi.spyOn(OriginalDate.prototype, "getHours").mockReturnValue(mockedLocalHour);
    }

    vi.stubGlobal(
        "Date",
        Object.assign(
            function FakeDate(...args: unknown[]): Date {
                if (args.length === 0) {
                    return new OriginalDate(now.getTime());
                }
                return new OriginalDate(...(args as ConstructorParameters<typeof Date>));
            },
            {
                now: () => now.getTime(),
                parse: OriginalDate.parse,
                UTC: OriginalDate.UTC,
                [Symbol.species]: OriginalDate,
            },
        ),
    );
    return OriginalDate;
}

/**
 * Wipes state of date mock.
 * @param {DateConstructor} OriginalDate The provided date object.
 */
export function restoreDate(OriginalDate: DateConstructor) {
    globalThis.Date = OriginalDate;
    if (getHoursSpy) {
        getHoursSpy.mockRestore();
        getHoursSpy = null;
    }
}
