import { vi } from "vitest";

/**
 * Mocks date for tests.
 * @param {Date} now - The provided date object.
 * @returns The mocked date.
 */
export function mockDate(now: Date) {
    const OriginalDate = globalThis.Date;
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
}
