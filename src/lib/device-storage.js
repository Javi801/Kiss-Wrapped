import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { PEOPLE_FILE_NAME, SETTINGS_FILE_NAME, STORAGE_KEY, LANGUAGE_KEY, ICON_COLOR_KEY, THEME_KEY, STATS_VISIBLE_KEY, SITUATION_TAGS_KEY, PLACE_TAGS_KEY } from "@/lib/constants";

// Returns localStorage only when it is safely available
export function getSafeStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error("Storage unavailable", error);
  }

  return null;
}

// Detects whether the app is running on a native platform
export function isNativePlatform() {
  return Capacitor.isNativePlatform?.() ?? false;
}

// Migrates legacy records that store a static `age` number to `birthYear`.
// Uses the current year as the reference; off by at most 1 year, which is
// acceptable given the dynamic calculation that follows.
function migrateLegacyAge(people) {
  const currentYear = new Date().getFullYear();
  return people.map((person) => {
    if (person.birthYear != null || person.age == null) return person;
    const { age, ...rest } = person;
    return { ...rest, birthYear: currentYear - age };
  });
}

// Loads people data from native file system or localStorage
export async function loadPeopleFromDevice() {
  if (isNativePlatform()) {
    try {
      const result = await Filesystem.readFile({
        path: PEOPLE_FILE_NAME,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      const parsed = JSON.parse(result.data || "[]");
      return migrateLegacyAge(Array.isArray(parsed) ? parsed : []);
    } catch {
      return [];
    }
  }

  const storage = getSafeStorage();
  if (!storage) return [];

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return migrateLegacyAge(Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

// Saves people data to native file system or localStorage
export async function savePeopleToDevice(people) {
  if (isNativePlatform()) {
    await Filesystem.writeFile({
      path: PEOPLE_FILE_NAME,
      directory: Directory.Data,
      data: JSON.stringify(people, null, 2),
      encoding: Encoding.UTF8,
      recursive: true,
    });
    return;
  }

  const storage = getSafeStorage();
  if (!storage) return;

  storage.setItem(STORAGE_KEY, JSON.stringify(people));
}

const SETTINGS_DEFAULTS = { iconColor: 'yellow', language: 'en', theme: 'pink', statsVisible: true, situationTags: [], placeTags: [] }

// Loads app settings from native file system or localStorage.
// On native, if the settings file doesn't exist yet, migrates values from
// localStorage (where they were stored before this function was introduced).
export async function loadSettings() {
  if (isNativePlatform()) {
    try {
      const result = await Filesystem.readFile({
        path: SETTINGS_FILE_NAME,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      })
      const saved = JSON.parse(result.data || '{}')
      if (typeof saved.statsVisible === 'string') saved.statsVisible = saved.statsVisible !== 'false'
      return { ...SETTINGS_DEFAULTS, ...saved }
    } catch {
      // Missing native settings are migrated from localStorage when possible.
      const storage = getSafeStorage()
      const rawVisible = storage?.getItem(STATS_VISIBLE_KEY)
      const migrated = {
        iconColor:    storage?.getItem(ICON_COLOR_KEY) || SETTINGS_DEFAULTS.iconColor,
        language:     storage?.getItem(LANGUAGE_KEY)  || SETTINGS_DEFAULTS.language,
        theme:        storage?.getItem(THEME_KEY)      || SETTINGS_DEFAULTS.theme,
        statsVisible: rawVisible === null ? SETTINGS_DEFAULTS.statsVisible : rawVisible !== 'false',
      }
      // Persist migrated values so future reads use the file
      await saveSettings(migrated).catch(() => {})
      return migrated
    }
  }
  const storage = getSafeStorage()
  if (!storage) return { ...SETTINGS_DEFAULTS }
  const rawVisible = storage.getItem(STATS_VISIBLE_KEY)
  const rawSituationTags = storage.getItem(SITUATION_TAGS_KEY)
  const rawPlaceTags = storage.getItem(PLACE_TAGS_KEY)
  return {
    iconColor:     storage.getItem(ICON_COLOR_KEY) || SETTINGS_DEFAULTS.iconColor,
    language:      storage.getItem(LANGUAGE_KEY)   || SETTINGS_DEFAULTS.language,
    theme:         storage.getItem(THEME_KEY)       || SETTINGS_DEFAULTS.theme,
    statsVisible:  rawVisible === null ? SETTINGS_DEFAULTS.statsVisible : rawVisible !== 'false',
    situationTags: rawSituationTags ? JSON.parse(rawSituationTags) : [],
    placeTags:     rawPlaceTags ? JSON.parse(rawPlaceTags) : [],
  }
}

// Saves app settings to native file system or localStorage
export async function saveSettings({ iconColor, language, theme, statsVisible, situationTags, placeTags }) {
  if (isNativePlatform()) {
    await Filesystem.writeFile({
      path: SETTINGS_FILE_NAME,
      directory: Directory.Data,
      data: JSON.stringify({ iconColor, language, theme, statsVisible, situationTags, placeTags }),
      encoding: Encoding.UTF8,
      recursive: true,
    })
    return
  }
  const storage = getSafeStorage()
  if (!storage) return
  if (iconColor !== undefined) storage.setItem(ICON_COLOR_KEY, iconColor)
  if (language !== undefined) storage.setItem(LANGUAGE_KEY, language)
  if (theme !== undefined) storage.setItem(THEME_KEY, theme)
  if (statsVisible !== undefined) storage.setItem(STATS_VISIBLE_KEY, String(statsVisible))
  if (situationTags !== undefined) storage.setItem(SITUATION_TAGS_KEY, JSON.stringify(situationTags))
  if (placeTags !== undefined) storage.setItem(PLACE_TAGS_KEY, JSON.stringify(placeTags))
}

const PERSON_REQUIRED_STRINGS = ["name", "gender", "howWeMet", "zodiacSign", "activity"];
const EVENT_REQUIRED_STRINGS  = ["date", "place", "situation"];

// Fills missing required fields with empty values before export.
// Returns { normalized, hadMissingFields } so callers can warn the user.
function normalizeForExport(people) {
  let hadMissingFields = false;

  const normalized = people.map((person) => {
    const p = { ...person };

    for (const field of PERSON_REQUIRED_STRINGS) {
      if (p[field] == null) { p[field] = ""; hadMissingFields = true; }
    }
    if (p.birthYear == null) { p.birthYear = null; hadMissingFields = true; }

    p.events = (person.events || []).map((event) => {
      const e = { ...event };
      for (const field of EVENT_REQUIRED_STRINGS) {
        if (e[field] == null) { e[field] = ""; hadMissingFields = true; }
      }
      return e;
    });

    return p;
  });

  return { normalized, hadMissingFields };
}

// Exports people data as a JSON file to external storage (native) or browser download (web).
// Returns { fileName, isNative, hadMissingFields } so callers can show the saved location to the user.
export async function exportPeopleJson(people) {
  const fileName = `kiss-recorder-data-${new Date().toISOString().slice(0, 10)}.json`;
  const { normalized, hadMissingFields } = normalizeForExport(people);
  const content = JSON.stringify(normalized, null, 2);
  const native = isNativePlatform();

  if (native) {
    await Filesystem.writeFile({
      path: fileName,
      directory: Directory.External,
      data: content,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    return { fileName, isNative: true, hadMissingFields };
  }

  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return { fileName, isNative: false, hadMissingFields };
}

// Clears persisted people data from native file system or localStorage
export async function clearPeopleFromDevice() {
  if (isNativePlatform()) {
    try {
      await Filesystem.deleteFile({
        path: PEOPLE_FILE_NAME,
        directory: Directory.Data,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.warn("People file did not exist", error);
    }
    return;
  }

  const storage = getSafeStorage();
  if (!storage) return;

  storage.removeItem(STORAGE_KEY);
}
