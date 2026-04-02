import { describe, expect, it, vi } from "vitest";

import { clearSessionState, loadSessionState, saveSessionState } from "./session";

function createStorage() {
  const values = new Map<string, string>();

  return {
    values,
    storage: {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        values.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        values.delete(key);
      }),
    },
  };
}

describe("session utilities", () => {
  it("loads validated versioned session data", () => {
    const { storage, values } = createStorage();
    values.set("demo", JSON.stringify({ version: 1, data: { value: "ok" } }));

    const result = loadSessionState({
      key: "demo",
      version: 1,
      storage,
      isData: (value): value is { value: string } => {
        if (typeof value !== "object" || value === null) {
          return false;
        }

        const parsed = value as Record<string, unknown>;
        return typeof parsed.value === "string";
      },
    });

    expect(result).toEqual({ value: "ok" });
  });

  it("returns null for malformed or invalid session data", () => {
    const { storage, values } = createStorage();
    values.set("broken", "not-json");

    const result = loadSessionState({
      key: "broken",
      version: 1,
      storage,
      isData: (_value): _value is { value: string } => true,
    });

    expect(result).toBeNull();
  });

  it("saves and clears versioned session data", () => {
    const { storage, values } = createStorage();

    saveSessionState({
      key: "demo",
      version: 2,
      storage,
      data: { value: "saved" },
    });

    expect(values.get("demo")).toBe(JSON.stringify({ version: 2, data: { value: "saved" } }));

    clearSessionState("demo", storage);

    expect(values.has("demo")).toBe(false);
  });
});
