// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'
import { todayString } from '@/lib/date'

const mockFeatures = vi.hoisted(() => ({ onboarding: false, pdfExport: false }))
const mockNative = vi.hoisted(() => ({ isNative: false }))
const mockCapacitorApp = vi.hoisted(() => ({ listeners: {}, removed: [], exitApp: null }))
const mockStorage = vi.hoisted(() => ({
  loadPeopleFromDevice: vi.fn(),
  savePeopleToDevice: vi.fn(),
  clearPeopleFromDevice: vi.fn(),
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
}))
const mockSetAppIconColor = vi.hoisted(() => vi.fn())
// Props last received by each screen.
const screens = vi.hoisted(() => ({}))

vi.mock('@/lib/config', async (importOriginal) => ({
  ...(await importOriginal()),
  FEATURES: mockFeatures,
}))
vi.mock('@/lib/device-storage', () => mockStorage)
vi.mock('@/plugins/appicon', () => ({ setAppIconColor: mockSetAppIconColor }))
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => mockNative.isNative },
}))
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (event, callback) => {
      mockCapacitorApp.listeners[event] = callback
      return Promise.resolve({ remove: () => mockCapacitorApp.removed.push(event) })
    },
    exitApp: (...args) => mockCapacitorApp.exitApp(...args),
  },
}))
vi.mock('framer-motion', async () => {
  const { createElement } = await import('react')
  return {
    motion: { div: ({ children, style, ref }) => createElement('div', { style, ref }, children) },
    AnimatePresence: ({ children }) => children,
  }
})

function mockScreen(name) {
  return async () => {
    const { createElement } = await import('react')
    return {
      default: (props) => {
        screens[name] = props
        return createElement('div', { 'data-screen': name })
      },
    }
  }
}

vi.mock('@/components/app/HomeScreen', mockScreen('main'))
vi.mock('@/components/app/AddPersonScreen', mockScreen('add'))
vi.mock('@/components/app/IntroScreen', mockScreen('intro'))
vi.mock('@/components/app/OnboardingScreen', mockScreen('onboarding'))
vi.mock('@/components/app/PrivacyScreen', mockScreen('privacy'))
vi.mock('@/components/people/PeopleManagerScreen', mockScreen('people'))
vi.mock('@/components/stats/StatsScreen', mockScreen('stats'))

import KissWrappedApp from '@/App'
import { DEFAULT_SETTINGS, ONBOARDING_VERSION } from '@/lib/config'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const SAVED_SETTINGS = {
  ...DEFAULT_SETTINGS,
  situationTags: [],
  placeTags: [],
  howWeMetTags: [],
  onboardingDone: true,
  onboardingVersion: ONBOARDING_VERSION,
}

const ana = { id: 'ana', name: 'Ana', events: [{ id: 'a1', date: '2024.01.01', score: 3 }] }
const bob = { id: 'bob', name: 'Bob', events: [{ id: 'b1', date: '2024.02.01', score: null }] }

let container
let root

async function boot({ people = [], settings = {} } = {}) {
  mockStorage.loadPeopleFromDevice.mockResolvedValue(people)
  mockStorage.loadSettings.mockResolvedValue({ ...SAVED_SETTINGS, ...settings })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<KissWrappedApp />)
  })
}

const visibleScreens = () =>
  [...container.querySelectorAll('[data-screen]')].map((node) => node.dataset.screen)
const navButtons = () => [...container.querySelectorAll('button')]
const savedPeople = () => mockStorage.savePeopleToDevice.mock.calls.at(-1)[0]
const savedSettings = () => mockStorage.saveSettings.mock.calls.at(-1)[0]
const pressBack = () => act(() => mockCapacitorApp.listeners.backButton())
const openMain = () => act(() => screens.intro.onOpenMain())
const go = (screen) => act(() => screens.main.onNavigate(screen))
// The stats screen is lazy: waits for its dynamic import so it replaces the fallback.
const settleLazyScreens = () => act(async () => vi.dynamicImportSettled())

// Boots, opens the app and lands on the people screen.
async function bootOnPeople(options) {
  await boot(options)
  openMain()
  go('people')
}

beforeEach(() => {
  vi.clearAllMocks()
  for (const key of Object.keys(screens)) delete screens[key]
  mockCapacitorApp.listeners = {}
  mockCapacitorApp.removed = []
  mockCapacitorApp.exitApp = vi.fn()
  mockFeatures.onboarding = false
  mockNative.isNative = false
  mockStorage.savePeopleToDevice.mockResolvedValue(undefined)
  mockStorage.saveSettings.mockResolvedValue(undefined)
  mockStorage.clearPeopleFromDevice.mockResolvedValue(undefined)
  if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {}
})

afterEach(() => {
  if (root) act(() => root.unmount())
  container?.remove()
  root = null
  document.documentElement.classList.remove('dark')
  vi.restoreAllMocks()
})

describe('App — boot', () => {
  it('shows nothing until the saved data has been read', async () => {
    mockStorage.loadPeopleFromDevice.mockReturnValue(new Promise(() => {}))
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<KissWrappedApp />)
    })
    expect(visibleScreens()).toEqual([])
    expect(navButtons()).toHaveLength(0)
  })

  it('opens on the intro screen without the bottom bar', async () => {
    await boot()
    expect(visibleScreens()).toEqual(['intro'])
    expect(navButtons()).toHaveLength(0)
  })

  it('does not overwrite stored data before it has been loaded', async () => {
    let finishLoad
    mockStorage.loadPeopleFromDevice.mockReturnValue(
      new Promise((resolve) => (finishLoad = resolve))
    )
    mockStorage.loadSettings.mockResolvedValue(SAVED_SETTINGS)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<KissWrappedApp />)
    })
    expect(mockStorage.savePeopleToDevice).not.toHaveBeenCalled()
    expect(mockStorage.saveSettings).not.toHaveBeenCalled()

    await act(async () => finishLoad([ana]))
    expect(savedPeople()).toMatchObject([{ id: 'ana', name: 'Ana' }])
  })

  it('hands the loaded people to the screens', async () => {
    await boot({ people: [ana, bob] })
    openMain()
    expect(screens.main.people.map((person) => person.id)).toEqual(['ana', 'bob'])
  })

  it('restores the saved language, theme, icon color and stats visibility', async () => {
    await boot({
      settings: { language: 'es', theme: 'green', iconColor: 'blue', statsVisible: false },
    })
    openMain()
    expect(screens.main).toMatchObject({
      language: 'es',
      theme: 'green',
      iconColor: 'blue',
      statsVisible: false,
      t: COPY.es,
    })
  })

  it('ignores saved values that are no longer supported', async () => {
    await boot({ settings: { language: 'fr', theme: 'neon', iconColor: 'teal' } })
    openMain()
    expect(screens.main).toMatchObject({
      language: DEFAULT_SETTINGS.language,
      theme: DEFAULT_SETTINGS.theme,
      iconColor: DEFAULT_SETTINGS.iconColor,
    })
  })

  it('offers the saved tags together with the ones already used in the data', async () => {
    const people = [
      {
        ...ana,
        howWeMet: 'School',
        events: [{ id: 'a1', date: '2024.01.01', place: 'Park', situation: 'Date' }],
      },
    ]
    await bootOnPeople({
      people,
      settings: { placeTags: ['Bar'], situationTags: ['Party'], howWeMetTags: ['App'] },
    })
    expect([...screens.people.placeTags].sort()).toEqual(['Bar', 'Park'])
    expect([...screens.people.situationTags].sort()).toEqual(['Date', 'Party'])
    expect([...screens.people.howWeMetTags].sort()).toEqual(['App', 'School'])
  })

  it('tolerates saved tag lists that are not arrays', async () => {
    await bootOnPeople({ settings: { placeTags: null, situationTags: 'x', howWeMetTags: 3 } })
    expect(screens.people.placeTags).toEqual([])
    expect(screens.people.situationTags).toEqual([])
    expect(screens.people.howWeMetTags).toEqual([])
  })

  it('starts empty on the intro screen when loading fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockStorage.loadPeopleFromDevice.mockRejectedValue(new Error('corrupt file'))
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<KissWrappedApp />)
    })
    expect(visibleScreens()).toEqual(['intro'])
    openMain()
    expect(screens.main.people).toEqual([])
  })

  it('applies the dark class to the document only for the dark theme', async () => {
    await boot({ settings: { theme: 'dark' } })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    openMain()
    act(() => screens.main.setTheme('pink'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('App — onboarding', () => {
  it('skips the onboarding while the feature is off', async () => {
    await boot({ settings: { onboardingDone: false, onboardingVersion: 0 } })
    expect(visibleScreens()).toEqual(['intro'])
  })

  it('shows the onboarding on first launch when the feature is on', async () => {
    mockFeatures.onboarding = true
    await boot({ settings: { onboardingDone: false, onboardingVersion: 0 } })
    expect(visibleScreens()).toEqual(['onboarding'])
    expect(navButtons()).toHaveLength(0)
  })

  it('shows the onboarding again after its version changes', async () => {
    mockFeatures.onboarding = true
    await boot({ settings: { onboardingDone: true, onboardingVersion: ONBOARDING_VERSION - 1 } })
    expect(visibleScreens()).toEqual(['onboarding'])
  })

  it('goes straight to the intro once the current onboarding was completed', async () => {
    mockFeatures.onboarding = true
    await boot()
    expect(visibleScreens()).toEqual(['intro'])
  })

  it('remembers a completed onboarding and continues to the intro', async () => {
    mockFeatures.onboarding = true
    await boot({ settings: { onboardingDone: false, onboardingVersion: 0 } })
    await act(async () => screens.onboarding.onComplete())
    expect(visibleScreens()).toEqual(['intro'])
    expect(savedSettings()).toMatchObject({
      onboardingDone: true,
      onboardingVersion: ONBOARDING_VERSION,
    })
  })
})

describe('App — navigation', () => {
  it('opens the dashboard with the bottom bar from the intro', async () => {
    await boot()
    openMain()
    expect(visibleScreens()).toEqual(['main'])
    const t = COPY[DEFAULT_SETTINGS.language]
    expect(navButtons().map((button) => button.textContent)).toEqual([
      t.home,
      t.add,
      t.people,
      t.stats,
    ])
  })

  it.each([
    ['people', 2],
    ['stats', 3],
  ])('switches to the %s screen from the bottom bar', async (screen, index) => {
    await boot()
    openMain()
    act(() => {
      navButtons()[index].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await settleLazyScreens()
    expect(visibleScreens()).toEqual([screen])
    expect(navButtons()).toHaveLength(4)
  })

  it('hides the bottom bar on the add screen', async () => {
    await boot()
    openMain()
    go('add')
    expect(visibleScreens()).toEqual(['add'])
    expect(navButtons()).toHaveLength(0)
  })

  it('returns to the intro when leaving the add screen', async () => {
    await boot()
    openMain()
    go('add')
    act(() => screens.add.onBack())
    expect(visibleScreens()).toEqual(['intro'])
  })
})

describe('App — hardware back button', () => {
  it('walks back through the visited screens and then exits', async () => {
    await boot()
    openMain()
    go('people')

    pressBack()
    expect(visibleScreens()).toEqual(['main'])
    pressBack()
    expect(visibleScreens()).toEqual(['intro'])
    expect(mockCapacitorApp.exitApp).not.toHaveBeenCalled()
    pressBack()
    expect(mockCapacitorApp.exitApp).toHaveBeenCalledOnce()
  })

  it('exits from the intro screen', async () => {
    await boot()
    pressBack()
    expect(mockCapacitorApp.exitApp).toHaveBeenCalledOnce()
    expect(visibleScreens()).toEqual(['intro'])
  })

  it('always goes from the add screen to the intro and forgets the history', async () => {
    await boot()
    openMain()
    go('add')
    pressBack()
    expect(visibleScreens()).toEqual(['intro'])
    pressBack()
    expect(mockCapacitorApp.exitApp).toHaveBeenCalledOnce()
  })

  it('closes an open dialog instead of navigating', async () => {
    await boot()
    openMain()
    go('stats')
    await settleLazyScreens()
    const closeDialog = vi.fn()
    screens.stats.modalBackRef.current = closeDialog

    pressBack()
    expect(closeDialog).toHaveBeenCalledOnce()
    expect(visibleScreens()).toEqual(['stats'])

    screens.stats.modalBackRef.current = null
    pressBack()
    expect(visibleScreens()).toEqual(['main'])
  })

  it('stops listening when the app unmounts', async () => {
    await boot()
    await act(async () => root.unmount())
    root = null
    expect(mockCapacitorApp.removed).toContain('backButton')
  })
})

describe('App — people mutations', () => {
  it('adds a person on top with a first event dated today and returns to the intro', async () => {
    await boot({ people: [ana] })
    openMain()
    go('add')
    await act(async () => screens.add.onSave({ name: 'Mia', gender: 'female' }))

    const [mia, ...rest] = savedPeople()
    expect(mia).toMatchObject({ name: 'Mia', gender: 'female', realName: '', howWeMet: '' })
    expect(mia.id).toEqual(expect.any(String))
    expect(mia.events).toHaveLength(1)
    expect(mia.events[0]).toMatchObject({ date: todayString(), details: '', score: null })
    expect(rest.map((person) => person.id)).toEqual(['ana'])
    expect(visibleScreens()).toEqual(['intro'])
  })

  it('keeps the real name and how-we-met given for a new person', async () => {
    await boot()
    openMain()
    go('add')
    await act(async () =>
      screens.add.onSave({ name: 'Mia', realName: 'Maria', howWeMet: 'School' })
    )
    expect(savedPeople()[0]).toMatchObject({ realName: 'Maria', howWeMet: 'School' })
  })

  it('forgets the navigation history after adding a person', async () => {
    await boot()
    openMain()
    go('add')
    await act(async () => screens.add.onSave({ name: 'Mia' }))
    pressBack()
    expect(mockCapacitorApp.exitApp).toHaveBeenCalledOnce()
  })

  it('gives every new person and event a different id', async () => {
    await boot()
    for (const name of ['Mia', 'Lia']) {
      openMain()
      go('add')
      await act(async () => screens.add.onSave({ name }))
    }
    const ids = savedPeople().flatMap((person) => [person.id, ...person.events.map((e) => e.id)])
    expect(new Set(ids).size).toBe(4)
  })

  it('updates only the edited person', async () => {
    await bootOnPeople({ people: [ana, bob] })
    await act(async () => screens.people.onUpdatePerson('bob', { name: 'Robert' }))
    expect(savedPeople().map((person) => person.name)).toEqual(['Ana', 'Robert'])
    expect(savedPeople()[1].events).toHaveLength(1)
  })

  it('deletes only the chosen person', async () => {
    await bootOnPeople({ people: [ana, bob] })
    await act(async () => screens.people.onDeletePerson('ana'))
    expect(savedPeople().map((person) => person.id)).toEqual(['bob'])
  })

  it('appends imported people after the existing ones', async () => {
    await boot({ people: [ana] })
    openMain()
    await act(async () => screens.main.onImportData([{ id: 'new', name: 'New', events: [] }]))
    expect(savedPeople().map((person) => person.id)).toEqual(['ana', 'new'])
  })

  it('normalizes imported people like stored ones', async () => {
    await boot()
    openMain()
    const imported = {
      id: 'new',
      name: 'New',
      events: [{ id: 'n1', date: '2024.01.01', score: 9 }],
    }
    await act(async () => screens.main.onImportData([imported]))
    expect(savedPeople()[0].events[0].score).toBeNull()
  })

  it('clears everything and returns to the intro', async () => {
    await boot({ people: [ana, bob] })
    openMain()
    await act(async () => screens.main.onClearData())
    expect(mockStorage.clearPeopleFromDevice).toHaveBeenCalledOnce()
    expect(savedPeople()).toEqual([])
    expect(visibleScreens()).toEqual(['intro'])
    pressBack()
    expect(mockCapacitorApp.exitApp).toHaveBeenCalledOnce()
  })

  it('still empties the app when the stored file cannot be removed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockStorage.clearPeopleFromDevice.mockRejectedValue(new Error('locked'))
    await boot({ people: [ana] })
    openMain()
    await act(async () => screens.main.onClearData())
    expect(savedPeople()).toEqual([])
    expect(visibleScreens()).toEqual(['intro'])
  })

  it('keeps working when saving fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockStorage.savePeopleToDevice.mockRejectedValue(new Error('disk full'))
    mockStorage.saveSettings.mockRejectedValue(new Error('disk full'))
    await bootOnPeople({ people: [ana, bob] })
    await act(async () => screens.people.onDeletePerson('ana'))
    expect(screens.people.people.map((person) => person.id)).toEqual(['bob'])
  })
})

describe('App — event mutations', () => {
  const eventsOf = (id) => savedPeople().find((person) => person.id === id).events

  it('puts a new event first and leaves other people untouched', async () => {
    await bootOnPeople({ people: [ana, bob] })
    await act(async () =>
      screens.people.onAddEvent('ana', { date: '2024.05.05', place: 'Park', score: 4 })
    )
    expect(eventsOf('ana')).toHaveLength(2)
    expect(eventsOf('ana')[0]).toMatchObject({ date: '2024.05.05', place: 'Park', score: 4 })
    expect(eventsOf('ana')[0].id).toEqual(expect.any(String))
    expect(eventsOf('ana')[0].id).not.toBe('a1')
    expect(eventsOf('bob')).toHaveLength(1)
  })

  it.each([[9], [-1], [2.5], ['3'], [undefined]])(
    'stores the invalid score %o of a new event as no score',
    async (score) => {
      await bootOnPeople({ people: [ana] })
      await act(async () => screens.people.onAddEvent('ana', { date: '2024.05.05', score }))
      expect(eventsOf('ana')[0].score).toBeNull()
    }
  )

  it('keeps a score of zero on a new event', async () => {
    await bootOnPeople({ people: [ana] })
    await act(async () => screens.people.onAddEvent('ana', { date: '2024.05.05', score: 0 }))
    expect(eventsOf('ana')[0].score).toBe(0)
  })

  it('adds an event to a person that has no events list', async () => {
    await bootOnPeople({ people: [{ id: 'new', name: 'New' }] })
    await act(async () => screens.people.onAddEvent('new', { date: '2024.05.05', score: 1 }))
    expect(eventsOf('new')).toHaveLength(1)
  })

  it('updates only the edited event and keeps its id', async () => {
    const people = [{ ...ana, events: [...ana.events, { id: 'a2', date: '2023.01.01', score: 1 }] }]
    await bootOnPeople({ people })
    await act(async () =>
      screens.people.onUpdateEvent('ana', 'a2', { date: '2023.02.02', score: 5 })
    )
    expect(eventsOf('ana')).toMatchObject([
      { id: 'a1', date: '2024.01.01', score: 3 },
      { id: 'a2', date: '2023.02.02', score: 5 },
    ])
  })

  it('stores an invalid score of an edited event as no score', async () => {
    await bootOnPeople({ people: [ana] })
    await act(async () => screens.people.onUpdateEvent('ana', 'a1', { score: 7 }))
    expect(eventsOf('ana')[0].score).toBeNull()
  })

  it('deletes only the chosen event', async () => {
    const people = [{ ...ana, events: [...ana.events, { id: 'a2', date: '2023.01.01' }] }, bob]
    await bootOnPeople({ people })
    await act(async () => screens.people.onDeleteEvent('ana', 'a1'))
    expect(eventsOf('ana').map((event) => event.id)).toEqual(['a2'])
    expect(eventsOf('bob')).toHaveLength(1)
  })

  it('deletes all events of a person but keeps the person', async () => {
    await bootOnPeople({ people: [ana, bob] })
    await act(async () => screens.people.onDeleteAllEvents('ana'))
    expect(eventsOf('ana')).toEqual([])
    expect(eventsOf('bob')).toHaveLength(1)
  })
})

describe('App — settings', () => {
  it('saves a changed language', async () => {
    await boot()
    openMain()
    await act(async () => screens.main.setLanguage('es'))
    expect(savedSettings().language).toBe('es')
    expect(screens.main.t).toBe(COPY.es)
  })

  it('saves a changed icon color and switches the launcher icon', async () => {
    await boot()
    openMain()
    await act(async () => screens.main.setIconColor('purple'))
    expect(savedSettings().iconColor).toBe('purple')
    expect(mockSetAppIconColor).toHaveBeenCalledWith('purple')
  })

  it('does not touch the launcher icon while booting', async () => {
    await boot({ settings: { iconColor: 'blue' } })
    expect(mockSetAppIconColor).not.toHaveBeenCalled()
  })

  it('saves the stats visibility and theme', async () => {
    await boot()
    openMain()
    await act(async () => {
      screens.main.setStatsVisible(false)
      screens.main.setTheme('green')
    })
    expect(savedSettings()).toMatchObject({ statsVisible: false, theme: 'green' })
  })

  it.each([
    ['onAddPlaceTag', 'placeTags'],
    ['onAddSituationTag', 'situationTags'],
    ['onAddHowWeMetTag', 'howWeMetTags'],
  ])('saves a new tag once through %s', async (handler, key) => {
    await bootOnPeople({ settings: { [key]: ['Old'] } })
    await act(async () => screens.people[handler]('New'))
    await act(async () => screens.people[handler]('New'))
    expect(savedSettings()[key]).toEqual(['Old', 'New'])
  })
})

describe('App — privacy overlay', () => {
  function setHidden(hidden) {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
  }

  afterEach(() => {
    delete document.hidden
  })

  it('covers the app while the browser tab is hidden', async () => {
    await boot()
    expect(visibleScreens()).not.toContain('privacy')
    setHidden(true)
    expect(visibleScreens()).toContain('privacy')
    setHidden(false)
    expect(visibleScreens()).not.toContain('privacy')
  })

  it('covers the native app on pause and uncovers it only when it is active again', async () => {
    mockNative.isNative = true
    await boot()
    act(() => {
      document.dispatchEvent(new Event('pause'))
    })
    expect(visibleScreens()).toContain('privacy')

    act(() => mockCapacitorApp.listeners.appStateChange({ isActive: false }))
    expect(visibleScreens()).toContain('privacy')

    act(() => mockCapacitorApp.listeners.appStateChange({ isActive: true }))
    expect(visibleScreens()).not.toContain('privacy')
  })

  it('ignores browser visibility changes on native', async () => {
    mockNative.isNative = true
    await boot()
    setHidden(true)
    expect(visibleScreens()).not.toContain('privacy')
  })

  it('stops listening to the native app state when the app unmounts', async () => {
    mockNative.isNative = true
    await boot()
    await act(async () => root.unmount())
    root = null
    expect(mockCapacitorApp.removed).toContain('appStateChange')
  })
})
