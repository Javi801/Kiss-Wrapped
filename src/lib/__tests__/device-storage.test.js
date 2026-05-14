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

// ---------------------------------------------------------------------------
// loadPeopleFromDevice
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// savePeopleToDevice
// ---------------------------------------------------------------------------
describe("savePeopleToDevice (web path)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes the people array as JSON to localStorage", async () => {
    const people = [{ id: "p1", name: "Ana", events: [] }];
    await savePeopleToDevice(people);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(people);
  });

  it("overwrites any existing entry", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ name: "Old" }]));
    const people = [{ name: "New", events: [] }];
    await savePeopleToDevice(people);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(people);
  });

  it("writes an empty array correctly", async () => {
    await savePeopleToDevice([]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// clearPeopleFromDevice
// ---------------------------------------------------------------------------
describe("clearPeopleFromDevice (web path)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes the people entry from localStorage", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ name: "Ana" }]));
    await clearPeopleFromDevice();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("does not throw when the entry does not exist", async () => {
    await expect(clearPeopleFromDevice()).resolves.not.toThrow();
  });
});
