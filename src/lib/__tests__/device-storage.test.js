// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockNative = vi.hoisted(() => ({ isNative: false }));
const mockFilesystem = vi.hoisted(() => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  deleteFile: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => mockNative.isNative },
}));

vi.mock("@capacitor/filesystem", () => ({
  Filesystem: mockFilesystem,
  Directory: { Data: "DATA", External: "EXTERNAL" },
  Encoding: { UTF8: "utf8" },
}));

// jsdom does not implement these URL methods
global.URL.createObjectURL = vi.fn(() => "blob:mock");
global.URL.revokeObjectURL = vi.fn();
// Prevent jsdom errors when the anchor is programmatically clicked
HTMLAnchorElement.prototype.click = vi.fn();

import {
  loadPeopleFromDevice,
  savePeopleToDevice,
  clearPeopleFromDevice,
  exportPeopleJson,
  loadSettings,
  saveSettings,
} from "@/lib/device-storage";
import { STORAGE_KEY, ICON_COLOR_KEY, LANGUAGE_KEY, THEME_KEY, SITUATION_TAGS_KEY, PLACE_TAGS_KEY, ONBOARDING_VERSION_KEY } from "@/lib/constants";

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

  it("migrates a legacy person with age but no birthYear", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T12:00:00"));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: "p1", name: "Ana", age: 25, events: [] }]));
    const result = await loadPeopleFromDevice();
    expect(result[0].birthYear).toBe(2001); // 2026 - 25
    expect(result[0].age).toBeUndefined();
    vi.useRealTimers();
  });

  it("does not overwrite birthYear when already present", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: "p1", name: "Ana", birthYear: 1990, events: [] }]));
    const result = await loadPeopleFromDevice();
    expect(result[0].birthYear).toBe(1990);
  });

  it("passes through a person with no age and no birthYear unchanged", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: "p1", name: "Ana", events: [] }]));
    const result = await loadPeopleFromDevice();
    expect(result[0].birthYear).toBeUndefined();
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

// ---------------------------------------------------------------------------
// exportPeopleJson (web path)
// ---------------------------------------------------------------------------

const COMPLETE_PERSON = {
  id: "p1",
  name: "Ana",
  birthYear: 2000,
  gender: "female",
  howWeMet: "school",
  zodiacSign: "♒ Aquarius",
  activity: "studies",
  events: [
    { id: "e1", date: "2024.01.01", place: "café", situation: "first date" },
  ],
};

describe("exportPeopleJson (web path) — return shape", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns isNative: false on web", async () => {
    const { isNative } = await exportPeopleJson([]);
    expect(isNative).toBe(false);
  });

  it("returns a fileName matching kiss-recorder-data-YYYY-MM-DD.json", async () => {
    const { fileName } = await exportPeopleJson([]);
    expect(fileName).toMatch(/^kiss-recorder-data-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it("triggers a browser download via createObjectURL and revokeObjectURL", async () => {
    await exportPeopleJson([COMPLETE_PERSON]);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });
});

describe("exportPeopleJson — hadMissingFields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is false for an empty people array", async () => {
    const { hadMissingFields } = await exportPeopleJson([]);
    expect(hadMissingFields).toBe(false);
  });

  it("is false when all required fields are present", async () => {
    const { hadMissingFields } = await exportPeopleJson([COMPLETE_PERSON]);
    expect(hadMissingFields).toBe(false);
  });

  it("is false when optional event fields are absent", async () => {
    const person = {
      ...COMPLETE_PERSON,
      events: [{ id: "e1", date: "2024.01.01", place: "bar", situation: "party", score: null }],
    };
    const { hadMissingFields } = await exportPeopleJson([person]);
    expect(hadMissingFields).toBe(false);
  });

  it("is true when a required person string field is null", async () => {
    for (const field of ["name", "gender", "howWeMet", "zodiacSign", "activity"]) {
      const { hadMissingFields } = await exportPeopleJson([{ ...COMPLETE_PERSON, [field]: null }]);
      expect(hadMissingFields, `expected true for missing person.${field}`).toBe(true);
    }
  });

  it("is true when a required person string field is undefined", async () => {
    const person = { ...COMPLETE_PERSON };
    delete person.name;
    const { hadMissingFields } = await exportPeopleJson([person]);
    expect(hadMissingFields).toBe(true);
  });

  it("is true when birthYear is null", async () => {
    const { hadMissingFields } = await exportPeopleJson([{ ...COMPLETE_PERSON, birthYear: null }]);
    expect(hadMissingFields).toBe(true);
  });

  it("is true when a required event string field is null", async () => {
    for (const field of ["date", "place", "situation"]) {
      const person = {
        ...COMPLETE_PERSON,
        events: [{ ...COMPLETE_PERSON.events[0], [field]: null }],
      };
      const { hadMissingFields } = await exportPeopleJson([person]);
      expect(hadMissingFields, `expected true for missing event.${field}`).toBe(true);
    }
  });
});

describe("exportPeopleJson — normalizeForExport output content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function captureExportedJson(fn) {
    return new Promise((resolve) => {
      const OrigBlob = global.Blob;
      global.Blob = class extends OrigBlob {
        constructor(parts, opts) {
          super(parts, opts);
          resolve(JSON.parse(parts[0]));
          global.Blob = OrigBlob;
        }
      };
      fn();
    });
  }

  it("fills null required person string field with empty string", async () => {
    const person = { ...COMPLETE_PERSON, name: null };
    const [exported, _] = await Promise.all([
      captureExportedJson(() => exportPeopleJson([person])),
      Promise.resolve(),
    ]);
    expect(exported[0].name).toBe("");
  });

  it("fills null required event string field with empty string", async () => {
    const person = {
      ...COMPLETE_PERSON,
      events: [{ ...COMPLETE_PERSON.events[0], place: null }],
    };
    const [exported] = await Promise.all([
      captureExportedJson(() => exportPeopleJson([person])),
      Promise.resolve(),
    ]);
    expect(exported[0].events[0].place).toBe("");
  });

  it("leaves birthYear as null when missing", async () => {
    const person = { ...COMPLETE_PERSON, birthYear: null };
    const [exported] = await Promise.all([
      captureExportedJson(() => exportPeopleJson([person])),
      Promise.resolve(),
    ]);
    expect(exported[0].birthYear).toBeNull();
  });

  it("preserves present fields unchanged", async () => {
    const [exported] = await Promise.all([
      captureExportedJson(() => exportPeopleJson([COMPLETE_PERSON])),
      Promise.resolve(),
    ]);
    expect(exported[0].name).toBe("Ana");
    expect(exported[0].birthYear).toBe(2000);
    expect(exported[0].events[0].place).toBe("café");
  });
});

// ---------------------------------------------------------------------------
// loadSettings (web path)
// ---------------------------------------------------------------------------
describe("loadSettings (web path)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns defaults when no settings are saved", async () => {
    expect(await loadSettings()).toEqual({ iconColor: "yellow", language: "en", theme: "pink", statsVisible: true, situationTags: [], placeTags: [], onboardingDone: false, onboardingVersion: 0 });
  });

  it("returns the saved iconColor", async () => {
    localStorage.setItem(ICON_COLOR_KEY, "pink");
    expect((await loadSettings()).iconColor).toBe("pink");
  });

  it("returns the saved language", async () => {
    localStorage.setItem(LANGUAGE_KEY, "es");
    expect((await loadSettings()).language).toBe("es");
  });

  it("returns the saved theme", async () => {
    localStorage.setItem(THEME_KEY, "dark");
    expect((await loadSettings()).theme).toBe("dark");
  });

  it("falls back to default iconColor when only language is saved", async () => {
    localStorage.setItem(LANGUAGE_KEY, "es");
    const settings = await loadSettings();
    expect(settings.iconColor).toBe("yellow");
    expect(settings.language).toBe("es");
    expect(settings.theme).toBe("pink");
  });

  it("falls back to default language when only iconColor is saved", async () => {
    localStorage.setItem(ICON_COLOR_KEY, "pink");
    const settings = await loadSettings();
    expect(settings.iconColor).toBe("pink");
    expect(settings.language).toBe("en");
    expect(settings.theme).toBe("pink");
  });

  it("returns saved situationTags", async () => {
    localStorage.setItem(SITUATION_TAGS_KEY, JSON.stringify(["Date", "Party"]));
    expect((await loadSettings()).situationTags).toEqual(["Date", "Party"]);
  });

  it("returns empty situationTags when none are saved", async () => {
    expect((await loadSettings()).situationTags).toEqual([]);
  });

  it("returns saved placeTags", async () => {
    localStorage.setItem(PLACE_TAGS_KEY, JSON.stringify(["Café", "Home"]));
    expect((await loadSettings()).placeTags).toEqual(["Café", "Home"]);
  });

  it("returns empty placeTags when none are saved", async () => {
    expect((await loadSettings()).placeTags).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// saveSettings (web path)
// ---------------------------------------------------------------------------
describe("saveSettings (web path)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves iconColor to localStorage", async () => {
    await saveSettings({ iconColor: "pink", language: "es" });
    expect(localStorage.getItem(ICON_COLOR_KEY)).toBe("pink");
  });

  it("saves language to localStorage", async () => {
    await saveSettings({ iconColor: "pink", language: "es" });
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe("es");
  });

  it("saves theme to localStorage", async () => {
    await saveSettings({ iconColor: "pink", language: "es", theme: "dark" });
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
  });

  it("does not overwrite iconColor when it is undefined", async () => {
    localStorage.setItem(ICON_COLOR_KEY, "yellow");
    await saveSettings({ language: "es" });
    expect(localStorage.getItem(ICON_COLOR_KEY)).toBe("yellow");
  });

  it("does not overwrite language when it is undefined", async () => {
    localStorage.setItem(LANGUAGE_KEY, "en");
    await saveSettings({ iconColor: "pink" });
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe("en");
  });

  it("does not overwrite theme when it is undefined", async () => {
    localStorage.setItem(THEME_KEY, "green");
    await saveSettings({ iconColor: "pink" });
    expect(localStorage.getItem(THEME_KEY)).toBe("green");
  });

  it("saves situationTags to localStorage", async () => {
    await saveSettings({ situationTags: ["Party", "Trip"] });
    expect(JSON.parse(localStorage.getItem(SITUATION_TAGS_KEY))).toEqual(["Party", "Trip"]);
  });

  it("does not overwrite situationTags when it is undefined", async () => {
    localStorage.setItem(SITUATION_TAGS_KEY, JSON.stringify(["Existing"]));
    await saveSettings({ iconColor: "pink" });
    expect(JSON.parse(localStorage.getItem(SITUATION_TAGS_KEY))).toEqual(["Existing"]);
  });

  it("saves placeTags to localStorage", async () => {
    await saveSettings({ placeTags: ["Café", "Home"] });
    expect(JSON.parse(localStorage.getItem(PLACE_TAGS_KEY))).toEqual(["Café", "Home"]);
  });

  it("does not overwrite placeTags when it is undefined", async () => {
    localStorage.setItem(PLACE_TAGS_KEY, JSON.stringify(["Existing"]));
    await saveSettings({ iconColor: "pink" });
    expect(JSON.parse(localStorage.getItem(PLACE_TAGS_KEY))).toEqual(["Existing"]);
  });

  it("round-trips correctly through save and load", async () => {
    await saveSettings({ iconColor: "blue", language: "es", theme: "dark", statsVisible: true, situationTags: ["Date", "Party"], placeTags: ["Café", "Home"], onboardingDone: true, onboardingVersion: 2 });
    expect(await loadSettings()).toEqual({ iconColor: "blue", language: "es", theme: "dark", statsVisible: true, situationTags: ["Date", "Party"], placeTags: ["Café", "Home"], onboardingDone: true, onboardingVersion: 2 });
  });

  it("saves onboardingVersion to localStorage", async () => {
    await saveSettings({ onboardingVersion: 2 });
    expect(localStorage.getItem(ONBOARDING_VERSION_KEY)).toBe("2");
  });
});

// ---------------------------------------------------------------------------
// loadSettings (native path — first-run migration from localStorage)
// ---------------------------------------------------------------------------
describe("loadSettings (native path — migration from localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNative.isNative = true;
    mockFilesystem.readFile.mockRejectedValue(new Error("File not found"));
    mockFilesystem.writeFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockNative.isNative = false;
    vi.clearAllMocks();
  });

  it("migrates situationTags from localStorage", async () => {
    localStorage.setItem(SITUATION_TAGS_KEY, JSON.stringify(["Party", "Trip"]));
    expect((await loadSettings()).situationTags).toEqual(["Party", "Trip"]);
  });

  it("migrates placeTags from localStorage", async () => {
    localStorage.setItem(PLACE_TAGS_KEY, JSON.stringify(["Café", "Home"]));
    expect((await loadSettings()).placeTags).toEqual(["Café", "Home"]);
  });

  it("returns empty tag arrays when localStorage has none", async () => {
    const settings = await loadSettings();
    expect(settings.situationTags).toEqual([]);
    expect(settings.placeTags).toEqual([]);
  });

  it("persists migrated tags to the native settings file", async () => {
    localStorage.setItem(SITUATION_TAGS_KEY, JSON.stringify(["Date"]));
    localStorage.setItem(PLACE_TAGS_KEY, JSON.stringify(["Home"]));
    await loadSettings();
    expect(mockFilesystem.writeFile).toHaveBeenCalledOnce();
    const written = JSON.parse(mockFilesystem.writeFile.mock.calls[0][0].data);
    expect(written.situationTags).toEqual(["Date"]);
    expect(written.placeTags).toEqual(["Home"]);
  });
});
