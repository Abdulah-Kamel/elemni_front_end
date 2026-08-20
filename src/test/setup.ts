import "@testing-library/jest-dom/vitest";

if (!globalThis.localStorage?.getItem) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => null,
      setItem: () => undefined,
    },
  });
}
