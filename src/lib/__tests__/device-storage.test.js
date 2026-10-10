// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const mockNative = vi.hoisted(() => ({ isNative: false }))
const mockFilesystem = vi.hoisted(() => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  getUri: vi.fn().mockResolvedValue({ uri: 'file:///mock/export.json' }),
}))
const mockShare = vi.hoisted(() => ({ share: vi.fn().mockResolvedValue(undefined) }))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => mockNative.isNative },
}))

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: mockFilesystem,
  Directory: { Data: 'DATA', External: 'EXTERNAL', Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
}))

vi.mock('@capacitor/share', () => ({ Share: mockShare }))

import {
  loadPeopleFromDevice,
  savePeopleToDevice,
  clearPeopleFromDevice,
  exportPeopleJson,
  loadSettings,
  saveSettings,
  getSafeStorage,
  isNativePlatform,
} from '@/lib/device-storage'
import {
  STORAGE_KEY,
  ICON_COLOR_KEY,
  LANGUAGE_KEY,
  THEME_KEY,
  STATS_VISIBLE_KEY,
  INCLUDE_PARTNER_EVENTS_KEY,
  SITUATION_TAGS_KEY,
  PLACE_TAGS_KEY,
  HOW_WE_MET_TAGS_KEY,
  ONBOARDING_VERSION_KEY,
  PEOPLE_FILE_NAME,
  SETTINGS_FILE_NAME,
} from '@/lib/constants'
import { DEFAULT_SETTINGS, LANGUAGES, THEMES, ICON_COLORS } from '@/lib/config'

// ---------------------------------------------------------------------------
// loadPeopleFromDevice
// ---------------------------------------------------------------------------
describe('loadPeopleFromDevice (web path)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty array when localStorage has no entry', async () => {
    expect(await loadPeopleFromDevice()).toEqual([])
  })

  it('returns parsed array from valid JSON', async () => {
    const people = [{ name: 'Ana', events: [] }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people))
    expect(await loadPeopleFromDevice()).toEqual(people)
  })

  it('returns empty array when JSON is malformed', async () => {
    localStorage.setItem(STORAGE_KEY, '{corrupted::json}')
    expect(await loadPeopleFromDevice()).toEqual([])
  })

  it('returns empty array when JSON parses to a non-array', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'array' }))
    expect(await loadPeopleFromDevice()).toEqual([])
  })

  it('migrates a legacy person with age but no birthYear', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00'))
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'p1', name: 'Ana', age: 25, events: [] }])
    )
    const result = await loadPeopleFromDevice()
    expect(result[0].birthYear).toBe(2001) // 2026 - 25
    expect(result[0].age).toBeUndefined()
    vi.useRealTimers()
  })

  it('does not overwrite birthYear when already present', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'p1', name: 'Ana', birthYear: 1990, events: [] }])
    )
    const result = await loadPeopleFromDevice()
    expect(result[0].birthYear).toBe(1990)
  })

  it('passes through a person with no age and no birthYear unchanged', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 'p1', name: 'Ana', events: [] }]))
    const result = await loadPeopleFromDevice()
    expect(result[0].birthYear).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// savePeopleToDevice
// ---------------------------------------------------------------------------
describe('savePeopleToDevice (web path)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('writes the people array as JSON to localStorage', async () => {
    const people = [{ id: 'p1', name: 'Ana', events: [] }]
    await savePeopleToDevice(people)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(people)
  })

  it('overwrites any existing entry', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ name: 'Old' }]))
    const people = [{ name: 'New', events: [] }]
    await savePeopleToDevice(people)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(people)
  })

  it('writes an empty array correctly', async () => {
    await savePeopleToDevice([])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// clearPeopleFromDevice
// ---------------------------------------------------------------------------
describe('clearPeopleFromDevice (web path)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes the people entry from localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ name: 'Ana' }]))
    await clearPeopleFromDevice()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('does not throw when the entry does not exist', async () => {
    await expect(clearPeopleFromDevice()).resolves.not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// exportPeopleJson (web path)
// ---------------------------------------------------------------------------

const COMPLETE_PERSON = {
  id: 'p1',
  name: 'Ana',
  realName: 'Ana García',
  birthYear: 2000,
  gender: 'female',
  howWeMet: 'school',
  zodiacSign: '♒ Aquarius',
  activity: 'studies',
  events: [{ id: 'e1', date: '2024.01.01', place: 'café', situation: 'first date' }],
}

function exportedJson() {
  const call = mockFilesystem.writeFile.mock.calls.at(-1)?.[0]
  return call ? JSON.parse(call.data) : null
}

describe('exportPeopleJson — return shape', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns isNative: true', async () => {
    const { isNative } = await exportPeopleJson([])
    expect(isNative).toBe(true)
  })

  it('returns a fileName matching kiss-wrapped-data-YYYY-MM-DD.json', async () => {
    const { fileName } = await exportPeopleJson([])
    expect(fileName).toMatch(/^kiss-wrapped-data-\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('writes to Cache directory and opens Share sheet', async () => {
    await exportPeopleJson([COMPLETE_PERSON])
    expect(mockFilesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ directory: 'CACHE' })
    )
    expect(mockShare.share).toHaveBeenCalledOnce()
  })
})

describe('exportPeopleJson — hadMissingFields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is false for an empty people array', async () => {
    const { hadMissingFields } = await exportPeopleJson([])
    expect(hadMissingFields).toBe(false)
  })

  it('is false when all required fields are present', async () => {
    const { hadMissingFields } = await exportPeopleJson([COMPLETE_PERSON])
    expect(hadMissingFields).toBe(false)
  })

  it('is false when realName is absent (optional field)', async () => {
    const { realName: _, ...personWithoutRealName } = COMPLETE_PERSON
    const { hadMissingFields } = await exportPeopleJson([personWithoutRealName])
    expect(hadMissingFields).toBe(false)
  })

  it('is false when optional event fields are absent', async () => {
    const person = {
      ...COMPLETE_PERSON,
      events: [{ id: 'e1', date: '2024.01.01', place: 'bar', situation: 'party', score: null }],
    }
    const { hadMissingFields } = await exportPeopleJson([person])
    expect(hadMissingFields).toBe(false)
  })

  it('is true when a required person string field is null', async () => {
    for (const field of ['name', 'gender', 'howWeMet', 'zodiacSign', 'activity']) {
      vi.clearAllMocks()
      const { hadMissingFields } = await exportPeopleJson([{ ...COMPLETE_PERSON, [field]: null }])
      expect(hadMissingFields, `expected true for missing person.${field}`).toBe(true)
    }
  })

  it('is true when a required person string field is undefined', async () => {
    const person = { ...COMPLETE_PERSON }
    delete person.name
    const { hadMissingFields } = await exportPeopleJson([person])
    expect(hadMissingFields).toBe(true)
  })

  it('is true when birthYear is null', async () => {
    const { hadMissingFields } = await exportPeopleJson([{ ...COMPLETE_PERSON, birthYear: null }])
    expect(hadMissingFields).toBe(true)
  })

  it('is true when a required event string field is null', async () => {
    for (const field of ['date', 'place', 'situation']) {
      vi.clearAllMocks()
      const person = {
        ...COMPLETE_PERSON,
        events: [{ ...COMPLETE_PERSON.events[0], [field]: null }],
      }
      const { hadMissingFields } = await exportPeopleJson([person])
      expect(hadMissingFields, `expected true for missing event.${field}`).toBe(true)
    }
  })
})

describe('exportPeopleJson — normalizeForExport output content', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fills null required person string field with empty string', async () => {
    await exportPeopleJson([{ ...COMPLETE_PERSON, name: null }])
    expect(exportedJson()[0].name).toBe('')
  })

  it('fills null required event string field with empty string', async () => {
    const person = { ...COMPLETE_PERSON, events: [{ ...COMPLETE_PERSON.events[0], place: null }] }
    await exportPeopleJson([person])
    expect(exportedJson()[0].events[0].place).toBe('')
  })

  it('fills absent optional realName with empty string without flagging hadMissingFields', async () => {
    const { realName: _, ...personWithoutRealName } = COMPLETE_PERSON
    await exportPeopleJson([personWithoutRealName])
    expect(exportedJson()[0].realName).toBe('')
  })

  it('leaves birthYear as null when missing', async () => {
    await exportPeopleJson([{ ...COMPLETE_PERSON, birthYear: null }])
    expect(exportedJson()[0].birthYear).toBeNull()
  })

  it('preserves present fields unchanged', async () => {
    await exportPeopleJson([COMPLETE_PERSON])
    const p = exportedJson()[0]
    expect(p.name).toBe('Ana')
    expect(p.realName).toBe('Ana García')
    expect(p.birthYear).toBe(2000)
    expect(p.events[0].place).toBe('café')
  })
})

// ---------------------------------------------------------------------------
// loadSettings (web path)
// ---------------------------------------------------------------------------
describe('loadSettings (web path)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns defaults when no settings are saved', async () => {
    expect(await loadSettings()).toEqual({
      iconColor: DEFAULT_SETTINGS.iconColor,
      language: DEFAULT_SETTINGS.language,
      theme: DEFAULT_SETTINGS.theme,
      statsVisible: DEFAULT_SETTINGS.statsVisible,
      includePartnerEvents: DEFAULT_SETTINGS.includePartnerEvents,
      situationTags: [],
      placeTags: [],
      howWeMetTags: [],
      onboardingDone: false,
      onboardingVersion: 0,
    })
  })

  it('returns the saved iconColor', async () => {
    localStorage.setItem(ICON_COLOR_KEY, 'pink')
    expect((await loadSettings()).iconColor).toBe('pink')
  })

  it('returns the saved language', async () => {
    localStorage.setItem(LANGUAGE_KEY, 'es')
    expect((await loadSettings()).language).toBe('es')
  })

  it('returns the saved theme', async () => {
    localStorage.setItem(THEME_KEY, 'dark')
    expect((await loadSettings()).theme).toBe('dark')
  })

  it('falls back to default iconColor when only language is saved', async () => {
    localStorage.setItem(LANGUAGE_KEY, 'es')
    const settings = await loadSettings()
    expect(settings.iconColor).toBe(DEFAULT_SETTINGS.iconColor)
    expect(settings.language).toBe('es')
    expect(settings.theme).toBe(DEFAULT_SETTINGS.theme)
  })

  it('falls back to default language when only iconColor is saved', async () => {
    localStorage.setItem(ICON_COLOR_KEY, 'pink')
    const settings = await loadSettings()
    expect(settings.iconColor).toBe('pink')
    expect(settings.language).toBe(DEFAULT_SETTINGS.language)
    expect(settings.theme).toBe(DEFAULT_SETTINGS.theme)
  })

  it('returns saved situationTags', async () => {
    localStorage.setItem(SITUATION_TAGS_KEY, JSON.stringify(['Date', 'Party']))
    expect((await loadSettings()).situationTags).toEqual(['Date', 'Party'])
  })

  it('returns empty situationTags when none are saved', async () => {
    expect((await loadSettings()).situationTags).toEqual([])
  })

  it('returns saved placeTags', async () => {
    localStorage.setItem(PLACE_TAGS_KEY, JSON.stringify(['Café', 'Home']))
    expect((await loadSettings()).placeTags).toEqual(['Café', 'Home'])
  })

  it('returns empty placeTags when none are saved', async () => {
    expect((await loadSettings()).placeTags).toEqual([])
  })

  it('returns saved howWeMetTags', async () => {
    localStorage.setItem(HOW_WE_MET_TAGS_KEY, JSON.stringify(['School', 'Work']))
    expect((await loadSettings()).howWeMetTags).toEqual(['School', 'Work'])
  })

  it('returns empty howWeMetTags when none are saved', async () => {
    expect((await loadSettings()).howWeMetTags).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// saveSettings (web path)
// ---------------------------------------------------------------------------
describe('saveSettings (web path)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves iconColor to localStorage', async () => {
    await saveSettings({ iconColor: 'pink', language: 'es' })
    expect(localStorage.getItem(ICON_COLOR_KEY)).toBe('pink')
  })

  it('saves language to localStorage', async () => {
    await saveSettings({ iconColor: 'pink', language: 'es' })
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('es')
  })

  it('saves theme to localStorage', async () => {
    await saveSettings({ iconColor: 'pink', language: 'es', theme: 'dark' })
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  })

  it('does not overwrite iconColor when it is undefined', async () => {
    localStorage.setItem(ICON_COLOR_KEY, 'yellow')
    await saveSettings({ language: 'es' })
    expect(localStorage.getItem(ICON_COLOR_KEY)).toBe('yellow')
  })

  it('does not overwrite language when it is undefined', async () => {
    localStorage.setItem(LANGUAGE_KEY, 'en')
    await saveSettings({ iconColor: 'pink' })
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en')
  })

  it('does not overwrite theme when it is undefined', async () => {
    localStorage.setItem(THEME_KEY, 'green')
    await saveSettings({ iconColor: 'pink' })
    expect(localStorage.getItem(THEME_KEY)).toBe('green')
  })

  it('saves situationTags to localStorage', async () => {
    await saveSettings({ situationTags: ['Party', 'Trip'] })
    expect(JSON.parse(localStorage.getItem(SITUATION_TAGS_KEY))).toEqual(['Party', 'Trip'])
  })

  it('does not overwrite situationTags when it is undefined', async () => {
    localStorage.setItem(SITUATION_TAGS_KEY, JSON.stringify(['Existing']))
    await saveSettings({ iconColor: 'pink' })
    expect(JSON.parse(localStorage.getItem(SITUATION_TAGS_KEY))).toEqual(['Existing'])
  })

  it('saves placeTags to localStorage', async () => {
    await saveSettings({ placeTags: ['Café', 'Home'] })
    expect(JSON.parse(localStorage.getItem(PLACE_TAGS_KEY))).toEqual(['Café', 'Home'])
  })

  it('does not overwrite placeTags when it is undefined', async () => {
    localStorage.setItem(PLACE_TAGS_KEY, JSON.stringify(['Existing']))
    await saveSettings({ iconColor: 'pink' })
    expect(JSON.parse(localStorage.getItem(PLACE_TAGS_KEY))).toEqual(['Existing'])
  })

  it('saves howWeMetTags to localStorage', async () => {
    await saveSettings({ howWeMetTags: ['School', 'Work'] })
    expect(JSON.parse(localStorage.getItem(HOW_WE_MET_TAGS_KEY))).toEqual(['School', 'Work'])
  })

  it('does not overwrite howWeMetTags when it is undefined', async () => {
    localStorage.setItem(HOW_WE_MET_TAGS_KEY, JSON.stringify(['Existing']))
    await saveSettings({ iconColor: 'pink' })
    expect(JSON.parse(localStorage.getItem(HOW_WE_MET_TAGS_KEY))).toEqual(['Existing'])
  })

  it('round-trips correctly through save and load', async () => {
    await saveSettings({
      iconColor: 'blue',
      language: 'es',
      theme: 'dark',
      statsVisible: true,
      includePartnerEvents: true,
      situationTags: ['Date', 'Party'],
      placeTags: ['Café', 'Home'],
      howWeMetTags: ['School', 'Work'],
      onboardingDone: true,
      onboardingVersion: 2,
    })
    expect(await loadSettings()).toEqual({
      iconColor: 'blue',
      language: 'es',
      theme: 'dark',
      statsVisible: true,
      includePartnerEvents: true,
      situationTags: ['Date', 'Party'],
      placeTags: ['Café', 'Home'],
      howWeMetTags: ['School', 'Work'],
      onboardingDone: true,
      onboardingVersion: 2,
    })
  })

  it('round-trips statsVisible: false through save and load', async () => {
    await saveSettings({ statsVisible: false })
    expect((await loadSettings()).statsVisible).toBe(false)
  })

  it('saves includePartnerEvents to localStorage', async () => {
    await saveSettings({ includePartnerEvents: true })
    expect(localStorage.getItem(INCLUDE_PARTNER_EVENTS_KEY)).toBe('true')
  })

  it('does not overwrite includePartnerEvents when it is undefined', async () => {
    localStorage.setItem(INCLUDE_PARTNER_EVENTS_KEY, 'true')
    await saveSettings({ theme: 'dark' })
    expect(localStorage.getItem(INCLUDE_PARTNER_EVENTS_KEY)).toBe('true')
  })

  it('round-trips includePartnerEvents: false through save and load', async () => {
    await saveSettings({ includePartnerEvents: true })
    await saveSettings({ includePartnerEvents: false })
    expect((await loadSettings()).includePartnerEvents).toBe(false)
  })

  it('saves onboardingVersion to localStorage', async () => {
    await saveSettings({ onboardingVersion: 2 })
    expect(localStorage.getItem(ONBOARDING_VERSION_KEY)).toBe('2')
  })
})

// ---------------------------------------------------------------------------
// loadSettings (native path — first-run migration from localStorage)
// ---------------------------------------------------------------------------
describe('loadSettings (native path — migration from localStorage)', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNative.isNative = true
    mockFilesystem.readFile.mockRejectedValue(new Error('File not found'))
    mockFilesystem.writeFile.mockResolvedValue(undefined)
  })

  afterEach(() => {
    mockNative.isNative = false
    vi.clearAllMocks()
  })

  it('migrates situationTags from localStorage', async () => {
    localStorage.setItem(SITUATION_TAGS_KEY, JSON.stringify(['Party', 'Trip']))
    expect((await loadSettings()).situationTags).toEqual(['Party', 'Trip'])
  })

  it('migrates placeTags from localStorage', async () => {
    localStorage.setItem(PLACE_TAGS_KEY, JSON.stringify(['Café', 'Home']))
    expect((await loadSettings()).placeTags).toEqual(['Café', 'Home'])
  })

  it('migrates howWeMetTags from localStorage', async () => {
    localStorage.setItem(HOW_WE_MET_TAGS_KEY, JSON.stringify(['School', 'Work']))
    expect((await loadSettings()).howWeMetTags).toEqual(['School', 'Work'])
  })

  it('returns empty tag arrays when localStorage has none', async () => {
    const settings = await loadSettings()
    expect(settings.situationTags).toEqual([])
    expect(settings.placeTags).toEqual([])
    expect(settings.howWeMetTags).toEqual([])
  })

  it('persists migrated tags to the native settings file', async () => {
    localStorage.setItem(SITUATION_TAGS_KEY, JSON.stringify(['Date']))
    localStorage.setItem(PLACE_TAGS_KEY, JSON.stringify(['Home']))
    localStorage.setItem(HOW_WE_MET_TAGS_KEY, JSON.stringify(['School']))
    await loadSettings()
    expect(mockFilesystem.writeFile).toHaveBeenCalledOnce()
    const written = JSON.parse(mockFilesystem.writeFile.mock.calls[0][0].data)
    expect(written.situationTags).toEqual(['Date'])
    expect(written.placeTags).toEqual(['Home'])
    expect(written.howWeMetTags).toEqual(['School'])
  })
})

// ---------------------------------------------------------------------------
// loadSettings (native path — existing file, success path)
// ---------------------------------------------------------------------------
describe('loadSettings (native path — reads existing file)', () => {
  beforeEach(() => {
    mockNative.isNative = true
    vi.clearAllMocks()
    mockFilesystem.writeFile.mockResolvedValue(undefined)
  })
  afterEach(() => {
    mockNative.isNative = false
  })

  it('returns settings from native file when it exists', async () => {
    const stored = {
      iconColor: 'pink',
      language: 'es',
      theme: 'dark',
      statsVisible: true,
      includePartnerEvents: true,
      situationTags: [],
      placeTags: [],
      howWeMetTags: ['School'],
      onboardingDone: true,
      onboardingVersion: 2,
    }
    mockFilesystem.readFile.mockResolvedValueOnce({ data: JSON.stringify(stored) })
    expect(await loadSettings()).toEqual(stored)
  })

  it("coerces statsVisible string 'false' to boolean false", async () => {
    mockFilesystem.readFile.mockResolvedValueOnce({
      data: JSON.stringify({ statsVisible: 'false' }),
    })
    expect((await loadSettings()).statsVisible).toBe(false)
  })

  it("coerces statsVisible string 'true' to boolean true", async () => {
    mockFilesystem.readFile.mockResolvedValueOnce({
      data: JSON.stringify({ statsVisible: 'true' }),
    })
    expect((await loadSettings()).statsVisible).toBe(true)
  })

  it("coerces includePartnerEvents string 'true' to boolean true", async () => {
    mockFilesystem.readFile.mockResolvedValueOnce({
      data: JSON.stringify({ includePartnerEvents: 'true' }),
    })
    expect((await loadSettings()).includePartnerEvents).toBe(true)
  })

  it("coerces includePartnerEvents string 'false' to boolean false", async () => {
    mockFilesystem.readFile.mockResolvedValueOnce({
      data: JSON.stringify({ includePartnerEvents: 'false' }),
    })
    expect((await loadSettings()).includePartnerEvents).toBe(false)
  })

  it("coerces onboardingDone string 'true' to boolean true", async () => {
    mockFilesystem.readFile.mockResolvedValueOnce({
      data: JSON.stringify({ onboardingDone: 'true' }),
    })
    expect((await loadSettings()).onboardingDone).toBe(true)
  })

  it("coerces onboardingDone string 'false' to boolean false", async () => {
    mockFilesystem.readFile.mockResolvedValueOnce({
      data: JSON.stringify({ onboardingDone: 'false' }),
    })
    expect((await loadSettings()).onboardingDone).toBe(false)
  })

  it('coerces onboardingVersion string to number', async () => {
    mockFilesystem.readFile.mockResolvedValueOnce({
      data: JSON.stringify({ onboardingVersion: '3' }),
    })
    expect((await loadSettings()).onboardingVersion).toBe(3)
  })

  it('fills missing fields with SETTINGS_DEFAULTS', async () => {
    mockFilesystem.readFile.mockResolvedValueOnce({ data: JSON.stringify({ language: 'es' }) })
    const settings = await loadSettings()
    expect(settings.iconColor).toBe(DEFAULT_SETTINGS.iconColor)
    expect(settings.theme).toBe(DEFAULT_SETTINGS.theme)
    expect(settings.statsVisible).toBe(DEFAULT_SETTINGS.statsVisible)
    expect(settings.includePartnerEvents).toBe(DEFAULT_SETTINGS.includePartnerEvents)
  })

  it('returns empty howWeMetTags when the settings file predates the field', async () => {
    mockFilesystem.readFile.mockResolvedValueOnce({
      data: JSON.stringify({ situationTags: ['Date'], placeTags: ['Home'] }),
    })
    const settings = await loadSettings()
    expect(settings.howWeMetTags).toEqual([])
    expect(settings.situationTags).toEqual(['Date'])
    expect(settings.placeTags).toEqual(['Home'])
  })
})

// ---------------------------------------------------------------------------
// loadPeopleFromDevice (native path)
// ---------------------------------------------------------------------------
describe('loadPeopleFromDevice (native path)', () => {
  beforeEach(() => {
    mockNative.isNative = true
    vi.clearAllMocks()
    mockFilesystem.writeFile.mockResolvedValue(undefined)
    mockFilesystem.deleteFile.mockResolvedValue(undefined)
    mockFilesystem.getUri.mockResolvedValue({ uri: 'file:///mock/export.json' })
  })
  afterEach(() => {
    mockNative.isNative = false
  })

  it('reads from Filesystem with Directory.Data', async () => {
    const people = [{ name: 'Ana', events: [] }]
    mockFilesystem.readFile.mockResolvedValueOnce({ data: JSON.stringify(people) })
    await loadPeopleFromDevice()
    expect(mockFilesystem.readFile).toHaveBeenCalledWith(
      expect.objectContaining({ directory: 'DATA' })
    )
  })

  it('returns parsed people array from native file', async () => {
    const people = [{ id: 'p1', name: 'Ana', events: [] }]
    mockFilesystem.readFile.mockResolvedValueOnce({ data: JSON.stringify(people) })
    expect(await loadPeopleFromDevice()).toEqual(people)
  })

  it('returns empty array when the file does not exist', async () => {
    mockFilesystem.readFile.mockRejectedValueOnce(new Error('File not found'))
    expect(await loadPeopleFromDevice()).toEqual([])
  })

  it('returns empty array when file content is malformed JSON', async () => {
    mockFilesystem.readFile.mockResolvedValueOnce({ data: '{bad json' })
    expect(await loadPeopleFromDevice()).toEqual([])
  })

  it('returns empty array when file parses to a non-array', async () => {
    mockFilesystem.readFile.mockResolvedValueOnce({ data: JSON.stringify({ not: 'array' }) })
    expect(await loadPeopleFromDevice()).toEqual([])
  })

  it('migrates legacy age to birthYear', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T12:00:00'))
    mockFilesystem.readFile.mockResolvedValueOnce({
      data: JSON.stringify([{ name: 'Ana', age: 25, events: [] }]),
    })
    const result = await loadPeopleFromDevice()
    expect(result[0].birthYear).toBe(2001)
    expect(result[0].age).toBeUndefined()
    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// savePeopleToDevice (native path)
// ---------------------------------------------------------------------------
describe('savePeopleToDevice (native path)', () => {
  beforeEach(() => {
    mockNative.isNative = true
    vi.clearAllMocks()
    mockFilesystem.writeFile.mockResolvedValue(undefined)
  })
  afterEach(() => {
    mockNative.isNative = false
  })

  it('writes to Filesystem with Directory.Data', async () => {
    await savePeopleToDevice([{ id: 'p1', name: 'Ana', events: [] }])
    expect(mockFilesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ path: PEOPLE_FILE_NAME, directory: 'DATA' })
    )
  })

  it('serializes the people array as JSON', async () => {
    const people = [{ id: 'p1', name: 'Ana', events: [] }]
    await savePeopleToDevice(people)
    const written = JSON.parse(mockFilesystem.writeFile.mock.calls[0][0].data)
    expect(written).toEqual(people)
  })

  it('writes an empty array correctly', async () => {
    await savePeopleToDevice([])
    const written = JSON.parse(mockFilesystem.writeFile.mock.calls[0][0].data)
    expect(written).toEqual([])
  })

  it('does not write to localStorage on native', async () => {
    localStorage.clear()
    await savePeopleToDevice([{ id: 'p1', name: 'Ana', events: [] }])
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// saveSettings (native path)
// ---------------------------------------------------------------------------
describe('saveSettings (native path)', () => {
  beforeEach(() => {
    mockNative.isNative = true
    vi.clearAllMocks()
    mockFilesystem.writeFile.mockResolvedValue(undefined)
  })
  afterEach(() => {
    mockNative.isNative = false
  })

  it('writes to Filesystem with Directory.Data', async () => {
    await saveSettings({
      iconColor: 'pink',
      language: 'es',
      theme: 'dark',
      statsVisible: false,
      situationTags: [],
      placeTags: [],
      onboardingDone: true,
      onboardingVersion: 1,
    })
    expect(mockFilesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ path: SETTINGS_FILE_NAME, directory: 'DATA' })
    )
  })

  it('serializes all settings fields correctly', async () => {
    const settings = {
      iconColor: 'pink',
      language: 'es',
      theme: 'dark',
      statsVisible: false,
      includePartnerEvents: true,
      situationTags: ['Date'],
      placeTags: ['Café'],
      howWeMetTags: ['School'],
      onboardingDone: true,
      onboardingVersion: 2,
    }
    await saveSettings(settings)
    const written = JSON.parse(mockFilesystem.writeFile.mock.calls[0][0].data)
    expect(written).toEqual(settings)
  })

  it('does not write to localStorage on native', async () => {
    localStorage.clear()
    await saveSettings({ iconColor: 'blue' })
    expect(localStorage.getItem(ICON_COLOR_KEY)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Persisted user choices vs. config defaults
// ---------------------------------------------------------------------------
// A setting the user changed must survive a reload: DEFAULT_SETTINGS from
// config.js may only fill in values that were never saved.
const USER_CHOICES = {
  language: LANGUAGES.find((value) => value !== DEFAULT_SETTINGS.language),
  theme: THEMES.find((value) => value !== DEFAULT_SETTINGS.theme),
  iconColor: ICON_COLORS.find((value) => value !== DEFAULT_SETTINGS.iconColor),
  statsVisible: !DEFAULT_SETTINGS.statsVisible,
  includePartnerEvents: !DEFAULT_SETTINGS.includePartnerEvents,
}
const SETTING_NAMES = Object.keys(USER_CHOICES)

describe('persisted settings override config defaults (web path)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('has a non-default value available for every setting', () => {
    for (const name of SETTING_NAMES) {
      expect(USER_CHOICES[name], name).toBeDefined()
      expect(USER_CHOICES[name], name).not.toBe(DEFAULT_SETTINGS[name])
    }
  })

  it.each(SETTING_NAMES)('keeps the saved %s after a reload', async (name) => {
    await saveSettings({ [name]: USER_CHOICES[name] })
    expect((await loadSettings())[name]).toBe(USER_CHOICES[name])
  })

  it.each(SETTING_NAMES)(
    'leaves the other settings on their defaults when only %s is saved',
    async (name) => {
      await saveSettings({ [name]: USER_CHOICES[name] })
      const settings = await loadSettings()
      for (const other of SETTING_NAMES.filter((item) => item !== name)) {
        expect(settings[other], other).toBe(DEFAULT_SETTINGS[other])
      }
    }
  )

  it('keeps every saved setting together after a reload', async () => {
    await saveSettings(USER_CHOICES)
    expect(await loadSettings()).toMatchObject(USER_CHOICES)
  })

  it('keeps a saved value that equals the default once it is stored', async () => {
    await saveSettings({ theme: DEFAULT_SETTINGS.theme })
    expect(localStorage.getItem(THEME_KEY)).toBe(DEFAULT_SETTINGS.theme)
  })
})

describe('persisted settings override config defaults (native path)', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNative.isNative = true
    vi.clearAllMocks()
    mockFilesystem.writeFile.mockResolvedValue(undefined)
  })
  afterEach(() => {
    mockNative.isNative = false
  })

  it.each(SETTING_NAMES)('keeps the %s stored in the settings file', async (name) => {
    mockFilesystem.readFile.mockResolvedValueOnce({
      data: JSON.stringify({ [name]: USER_CHOICES[name] }),
    })
    expect((await loadSettings())[name]).toBe(USER_CHOICES[name])
  })

  it('reads back exactly what saveSettings wrote', async () => {
    await saveSettings({
      ...USER_CHOICES,
      situationTags: [],
      placeTags: [],
      onboardingDone: true,
      onboardingVersion: 1,
    })
    const written = mockFilesystem.writeFile.mock.calls[0][0].data
    mockFilesystem.readFile.mockResolvedValueOnce({ data: written })
    expect(await loadSettings()).toMatchObject(USER_CHOICES)
  })

  it('reads back the tag lists saveSettings wrote', async () => {
    const tags = {
      situationTags: ['Date', 'Party'],
      placeTags: ['Café', 'Home'],
      howWeMetTags: ['School', 'Work'],
    }
    await saveSettings({ ...USER_CHOICES, ...tags, onboardingDone: true, onboardingVersion: 1 })
    const written = mockFilesystem.writeFile.mock.calls[0][0].data
    mockFilesystem.readFile.mockResolvedValueOnce({ data: written })
    expect(await loadSettings()).toMatchObject(tags)
  })

  it.each(SETTING_NAMES)(
    'migrates the %s saved in localStorage instead of using the default',
    async (name) => {
      const keys = {
        language: LANGUAGE_KEY,
        theme: THEME_KEY,
        iconColor: ICON_COLOR_KEY,
        statsVisible: STATS_VISIBLE_KEY,
        includePartnerEvents: INCLUDE_PARTNER_EVENTS_KEY,
      }
      localStorage.setItem(keys[name], String(USER_CHOICES[name]))
      mockFilesystem.readFile.mockRejectedValueOnce(new Error('File not found'))

      expect((await loadSettings())[name]).toBe(USER_CHOICES[name])
      const written = JSON.parse(mockFilesystem.writeFile.mock.calls[0][0].data)
      expect(written[name]).toBe(USER_CHOICES[name])
    }
  )
})

// ---------------------------------------------------------------------------
// getSafeStorage / isNativePlatform
// ---------------------------------------------------------------------------
describe('getSafeStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns localStorage when it is available', () => {
    expect(getSafeStorage()).toBe(window.localStorage)
  })

  it('returns null when accessing localStorage throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(getSafeStorage()).toBeNull()
  })
})

describe('isNativePlatform', () => {
  afterEach(() => {
    mockNative.isNative = false
  })

  it('reports the platform given by Capacitor', () => {
    mockNative.isNative = false
    expect(isNativePlatform()).toBe(false)
    mockNative.isNative = true
    expect(isNativePlatform()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// clearPeopleFromDevice (native path)
// ---------------------------------------------------------------------------
describe('clearPeopleFromDevice (native path)', () => {
  beforeEach(() => {
    mockNative.isNative = true
    vi.clearAllMocks()
    mockFilesystem.deleteFile.mockResolvedValue(undefined)
    localStorage.clear()
  })

  afterEach(() => {
    mockNative.isNative = false
    vi.restoreAllMocks()
  })

  it('deletes the people file from the data directory', async () => {
    await clearPeopleFromDevice()
    expect(mockFilesystem.deleteFile).toHaveBeenCalledWith({
      path: PEOPLE_FILE_NAME,
      directory: 'DATA',
    })
  })

  it('resolves when the people file does not exist', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockFilesystem.deleteFile.mockRejectedValueOnce(new Error('File does not exist'))
    await expect(clearPeopleFromDevice()).resolves.toBeUndefined()
  })

  it('leaves localStorage untouched', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ name: 'Ana' }]))
    await clearPeopleFromDevice()
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// exportPeopleJson — cleanup failure
// ---------------------------------------------------------------------------
describe('exportPeopleJson — cleanup failure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('still returns the export result when the cache file cannot be deleted', async () => {
    mockFilesystem.deleteFile.mockRejectedValueOnce(new Error('delete failed'))
    const result = await exportPeopleJson([COMPLETE_PERSON])
    expect(result.hadMissingFields).toBe(false)
    expect(mockShare.share).toHaveBeenCalledOnce()
  })
})
