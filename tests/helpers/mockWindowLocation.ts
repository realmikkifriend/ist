/**
 * Creates a fake window to change locations in.
 * @param {Partial<Location>} mockedProps - The input properties.
 * @returns A new location.
 */
export function mockWindowLocation(mockedProps: Partial<Location>) {
    const originalLocation = globalThis.window.location;

    Object.defineProperty(globalThis.window, "location", {
        value: { ...originalLocation, ...mockedProps },
        configurable: true,
        writable: true,
    });

    return () => {
        Object.defineProperty(globalThis.window, "location", {
            value: originalLocation,
            configurable: true,
            writable: true,
        });
    };
}
