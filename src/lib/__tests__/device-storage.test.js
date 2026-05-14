// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => false },
}));

vi.mock("@capacitor/filesystem", () => ({
  Filesystem: {},
  Directory: {},
  Encoding: {},
}));

import { loadPeopleFromDevice } from "@/lib/device-storage";
import { STORAGE_KEY } from "@/lib/constants";

describe("loadPeopleFromDevice (web path)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty array when localStorage has no entry", async () => {
    expect(await loadPeopleFromDevice()).toEqual([]);
  });

  it("returns parsed array from valid JSON", async () => {
    const people = [{ name: "Ana", events: [] }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
    expect(await loadPeopleFromDevice()).toEqual(people);
  });

  it("returns empty array when JSON is malformed", async () => {
    localStorage.setItem(STORAGE_KEY, "{corrupted::json}");
    expect(await loadPeopleFromDevice()).toEqual([]);
  });

  it("returns empty array when JSON parses to a non-array", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: "array" }));
    expect(await loadPeopleFromDevice()).toEqual([]);
  });
});
