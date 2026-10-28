// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY, SCREENS } from '@/lib/constants'
import { APP_GITHUB_REPO, APP_VERSION } from '@/lib/config'
import { TOUR_LAYERS, TOUR_TARGETS } from '@/lib/onboarding'

const mockStorage = vi.hoisted(() => ({ exportPeopleJson: vi.fn() }))
const mockPdf = vi.hoisted(() => ({ saveErrorLog: vi.fn() }))
const seen = vi.hoisted(() => ({ tiles: [], colors: null, openDialogs: [], dialogContent: null }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({ backdrop: 'rgb(1, 2, 3)' }) }))
vi.mock('@/lib/device-storage', () => mockStorage)
vi.mock('@/lib/pdf-export', () => mockPdf)
vi.mock('@/components/app/ColorSelector', () => ({
  default: (props) => {
    seen.colors = props
    return null
  },
}))
vi.mock('@/components/shared/StatTile', () => ({
  default: (props) => {
    seen.tiles.push(props)
    return null
  },
}))
// Only open dialogs render, each exposing its onOpenChange handler and the props of its content.
vi.mock('@/components/ui/dialog', async () => {
  const { createElement } = await import('react')
  const passthrough = ({ children }) => children
  return {
    Dialog: ({ open, onOpenChange, children }) => {
      if (!open) return null
      seen.openDialogs.push(onOpenChange)
      return createElement('div', { 'data-dialog': true }, children)
    },
    DialogContent: ({ children, ...props }) => {
      seen.dialogContent = props
      return children
    },
    DialogHeader: passthrough,
    DialogTitle: passthrough,
    DialogDescription: passthrough,
    DialogFooter: passthrough,
  }
})

import MainScreen from '@/components/app/HomeScreen'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

const ana = { id: 'ana', name: 'Ana', events: [{ id: 'a1', date: '2024.01.01' }] }
const bob = { id: 'bob', name: 'Bob', events: [] }

let container
let root
let handlers
let modalBackRef

function render(props = {}) {
  handlers = {
    onNavigate: vi.fn(),
    onClearData: vi.fn(),
    onImportData: vi.fn(),
    setLanguage: vi.fn(),
    setIconColor: vi.fn(),
    setTheme: vi.fn(),
    setStatsVisible: vi.fn(),
  }
  modalBackRef = { current: null }
  seen.tiles = []
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <MainScreen
        people={[ana, bob]}
        t={t}
        language="en"
        iconColor="notebookPink"
        theme="pink"
        statsVisible
        modalBackRef={modalBackRef}
        {...handlers}
        {...props}
      />
    )
  })
}

const dialog = () => container.querySelector('[data-dialog]')
const find = (label, scope = container) =>
  [...scope.querySelectorAll('button')].find(
    (item) => item.textContent.includes(label) || item.getAttribute('aria-label') === label
  )
const click = (label, scope = container) =>
  act(async () => {
    find(label, scope).click()
  })
const tile = (label) => seen.tiles.findLast((item) => item.label === label)
const fileInput = () => container.querySelector('input[type="file"]')

// Simulates the user picking a file in the import dialog.
function pickFile(name, content) {
  const input = fileInput()
  const file = content === undefined ? undefined : { name, text: async () => content }
  Object.defineProperty(input, 'files', { configurable: true, value: file ? [file] : [] })
  return act(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

const importJson = (data) => pickFile('backup.json', JSON.stringify(data))

beforeEach(() => {
  vi.clearAllMocks()
  seen.colors = null
  seen.openDialogs = []
  seen.dialogContent = null
  mockStorage.exportPeopleJson.mockResolvedValue({
    fileName: 'kiss-wrapped-data-2024-01-01.json',
    isNative: true,
    hadMissingFields: false,
  })
  mockPdf.saveErrorLog.mockResolvedValue(undefined)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

describe('HomeScreen — summary', () => {
  it('shows how many people and events are saved', () => {
    render()
    expect(tile(t.peopleSaved).value).toBe(2)
    expect(tile(t.totalEvents).value).toBe(1)
  })

  it('counts zero events for people without an events list', () => {
    render({ people: [{ id: 'new', name: 'New' }] })
    expect(tile(t.peopleSaved).value).toBe(1)
    expect(tile(t.totalEvents).value).toBe(0)
  })

  it('hides both figures when the stats are hidden', () => {
    render({ statsVisible: false })
    expect(tile(t.peopleSaved).value).toBe('-')
    expect(tile(t.totalEvents).value).toBe('-')
  })

  it('toggles the stats visibility', async () => {
    render()
    await click(t.hideStats)
    const toggle = handlers.setStatsVisible.mock.calls[0][0]
    expect(toggle(true)).toBe(false)
    expect(toggle(false)).toBe(true)
  })

  it('labels the toggle by what it will do', () => {
    render({ statsVisible: false })
    expect(find(t.showStats)).toBeDefined()
    expect(find(t.showStats).getAttribute('aria-pressed')).toBe('true')
  })
})

describe('HomeScreen — navigation', () => {
  it.each([
    [SCREENS.add, t.addNewPerson],
    [SCREENS.people, t.viewEditPeople],
    [SCREENS.stats, t.viewStatistics],
  ])('opens the %s screen', async (screen, label) => {
    render()
    await click(label)
    expect(handlers.onNavigate).toHaveBeenCalledWith(screen)
  })
})

describe('HomeScreen — language', () => {
  it('offers both languages and applies the chosen one', async () => {
    render()
    await click(t.language)
    expect(dialog().textContent).toContain(t.english)
    await click(t.spanish, dialog())
    expect(handlers.setLanguage).toHaveBeenCalledWith('es')
    expect(dialog()).toBeNull()
  })
})

describe('HomeScreen — settings and about', () => {
  it('passes the appearance settings to the color selector', async () => {
    render()
    await click(t.settings)
    expect(seen.colors).toMatchObject({
      iconColor: 'notebookPink',
      setIconColor: handlers.setIconColor,
      theme: 'pink',
      setTheme: handlers.setTheme,
    })
  })

  it('moves from settings to the about dialog', async () => {
    render()
    await click(t.settings)
    await click(t.about, dialog())
    expect(container.querySelectorAll('[data-dialog]')).toHaveLength(1)
    expect(dialog().textContent).toContain(`${t.aboutVersion} ${APP_VERSION}`)
  })

  it('opens the project page from the about dialog', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    render()
    await click(t.settings)
    await click(t.about, dialog())
    const link = [...dialog().querySelectorAll('button')].find(
      (item) => item.textContent !== t.close
    )
    act(() => link.click())
    expect(open).toHaveBeenCalledWith(APP_GITHUB_REPO, '_blank')
  })

  it('closes the about dialog', async () => {
    render()
    await click(t.settings)
    await click(t.about, dialog())
    await click(t.close, dialog())
    expect(dialog()).toBeNull()
  })
})

describe('HomeScreen — export', () => {
  it('exports the people and reports where the file went', async () => {
    render()
    await click(t.exportJsonLabel)
    expect(mockStorage.exportPeopleJson).toHaveBeenCalledWith([ana, bob])
    expect(dialog().textContent).toContain(t.exportJsonSuccessTitle)
    expect(dialog().textContent).toContain('kiss-wrapped-data-2024-01-01.json')
    expect(dialog().textContent).toContain(t.exportJsonLocationNative)
    expect(dialog().textContent).not.toContain(t.exportJsonSuccessWithWarningsDesc)
  })

  it('describes the browser download location on web', async () => {
    mockStorage.exportPeopleJson.mockResolvedValue({
      fileName: 'data.json',
      isNative: false,
      hadMissingFields: false,
    })
    render()
    await click(t.exportJsonLabel)
    expect(dialog().textContent).toContain(t.exportJsonLocationWeb)
  })

  it('warns when the exported data had missing fields', async () => {
    mockStorage.exportPeopleJson.mockResolvedValue({
      fileName: 'data.json',
      isNative: true,
      hadMissingFields: true,
    })
    render()
    await click(t.exportJsonLabel)
    expect(dialog().textContent).toContain(t.exportJsonSuccessWithWarningsTitle)
    expect(dialog().textContent).toContain(t.exportJsonSuccessWithWarningsDesc)
  })

  it('closes the success dialog', async () => {
    render()
    await click(t.exportJsonLabel)
    await click(t.close, dialog())
    expect(dialog()).toBeNull()
  })

  it('reports a failed export with its reason', async () => {
    mockStorage.exportPeopleJson.mockRejectedValue(new Error('no space left'))
    render()
    await click(t.exportJsonLabel)
    expect(dialog().textContent).toContain(t.exportJsonErrorTitle)
    expect(dialog().textContent).toContain('no space left')
    expect(dialog().textContent).not.toContain(t.exportJsonSuccessTitle)
  })

  it('saves the error log of a failed export and closes', async () => {
    const failure = new Error('no space left')
    mockStorage.exportPeopleJson.mockRejectedValue(failure)
    render()
    await click(t.exportJsonLabel)
    await click(t.saveJsonErrorLog, dialog())
    expect(mockPdf.saveErrorLog).toHaveBeenCalledWith(failure)
    expect(dialog()).toBeNull()
  })

  it('wraps a failure that is not an Error', async () => {
    mockStorage.exportPeopleJson.mockRejectedValue('plain failure')
    render()
    await click(t.exportJsonLabel)
    expect(dialog().textContent).toContain('plain failure')
    await click(t.saveJsonErrorLog, dialog())
    expect(mockPdf.saveErrorLog.mock.calls[0][0]).toBeInstanceOf(Error)
  })

  it('does not log anything when the error dialog is just closed', async () => {
    mockStorage.exportPeopleJson.mockRejectedValue(new Error('no space left'))
    render()
    await click(t.exportJsonLabel)
    await click(t.close, dialog())
    expect(mockPdf.saveErrorLog).not.toHaveBeenCalled()
    expect(dialog()).toBeNull()
  })
})

describe('HomeScreen — import', () => {
  const mia = { id: 'mia', name: 'Mia', events: [] }
  const lia = { id: 'lia', name: 'Lia', events: [] }

  it('opens the file picker, restricted to JSON', () => {
    render()
    const pick = vi.spyOn(fileInput(), 'click').mockImplementation(() => {})
    act(() => find(t.importJsonLabel).click())
    expect(pick).toHaveBeenCalledOnce()
    expect(fileInput().accept).toBe('.json')
  })

  it('does nothing when the picker is cancelled', async () => {
    render()
    await pickFile()
    expect(dialog()).toBeNull()
  })

  it('rejects a file that is not JSON by name', async () => {
    render()
    await pickFile('backup.txt', '[]')
    expect(dialog().textContent).toContain(t.importJsonErrorTypeTitle)
    expect(handlers.onImportData).not.toHaveBeenCalled()
  })

  it('accepts an upper-case .JSON extension', async () => {
    render()
    await pickFile('BACKUP.JSON', JSON.stringify([mia]))
    expect(dialog().textContent).toContain(t.importJsonConfirmTitle)
  })

  it.each([
    ['broken JSON', '{not json'],
    ['an object instead of a list', '{"id":"mia"}'],
    ['a list of non-objects', '[1, "two"]'],
    ['a list containing null', '[null]'],
    ['a list containing lists', '[[]]'],
  ])('rejects %s as an invalid format', async (_case, content) => {
    render()
    await pickFile('backup.json', content)
    expect(dialog().textContent).toContain(t.importJsonErrorFormatTitle)
    expect(handlers.onImportData).not.toHaveBeenCalled()
  })

  it('asks for confirmation before importing', async () => {
    render()
    await importJson([mia, lia])
    expect(dialog().textContent).toContain(t.importJsonConfirmTitle)
    expect(dialog().textContent).toContain(`2 ${t.importJsonConfirmPeople}`)
    expect(dialog().textContent).toContain(`2 ${t.importJsonConfirmNew}`)
    expect(dialog().textContent).not.toContain(t.importJsonConfirmSkipped)
    expect(handlers.onImportData).not.toHaveBeenCalled()
  })

  it('skips people that are already saved', async () => {
    render()
    await importJson([ana, mia])
    expect(dialog().textContent).toContain(`2 ${t.importJsonConfirmPeople}`)
    expect(dialog().textContent).toContain(`1 ${t.importJsonConfirmNew}`)
    expect(dialog().textContent).toContain(`1 ${t.importJsonConfirmSkipped}`)
  })

  it('imports only the new people once confirmed', async () => {
    render()
    await importJson([ana, mia, lia])
    await click(t.importJsonConfirmAction, dialog())
    expect(handlers.onImportData).toHaveBeenCalledOnce()
    expect(handlers.onImportData).toHaveBeenCalledWith([mia, lia])
    expect(dialog().textContent).toContain(t.importJsonSuccessTitle)
    expect(dialog().textContent).toContain(`2 ${t.importJsonSuccessDesc}`)
  })

  it('imports nothing when the confirmation is cancelled', async () => {
    render()
    await importJson([mia])
    await click(t.cancel, dialog())
    expect(handlers.onImportData).not.toHaveBeenCalled()
    expect(dialog()).toBeNull()
  })

  it.each([
    ['everyone in the file is already saved', [ana, bob]],
    ['the file is an empty list', []],
  ])('says there is nothing to import when %s', async (_case, data) => {
    render()
    await importJson(data)
    expect(dialog().textContent).toContain(t.importJsonEmptyTitle)
    expect(handlers.onImportData).not.toHaveBeenCalled()
  })

  it('lets the same file be picked again', async () => {
    render()
    const input = fileInput()
    let value = 'C:\\fakepath\\backup.json'
    Object.defineProperty(input, 'value', {
      configurable: true,
      get: () => value,
      set: (next) => {
        value = next
      },
    })
    await importJson([mia])
    expect(value).toBe('')
  })

  it.each([
    ['success', [{ id: 'mia', name: 'Mia' }], true],
    ['empty', [], false],
    ['error', null, false],
  ])('closes the %s dialog', async (_case, data, confirm) => {
    render()
    if (data) await importJson(data)
    else await pickFile('backup.txt', '')
    if (confirm) await click(t.importJsonConfirmAction, dialog())
    await click(t.close, dialog())
    expect(dialog()).toBeNull()
  })
})

describe('HomeScreen — clearing data', () => {
  it('clears the data only after confirming', async () => {
    render()
    await click(t.clearLocalDataLabel)
    expect(dialog().textContent).toContain(t.clearDataConfirmTitle)
    expect(handlers.onClearData).not.toHaveBeenCalled()

    await click(t.clearDataConfirmAction, dialog())
    expect(handlers.onClearData).toHaveBeenCalledOnce()
    expect(dialog()).toBeNull()
  })

  it('keeps the data when the confirmation is cancelled', async () => {
    render()
    await click(t.clearLocalDataLabel)
    await click(t.cancel, dialog())
    expect(handlers.onClearData).not.toHaveBeenCalled()
    expect(dialog()).toBeNull()
  })
})

describe('HomeScreen — hardware back button and dismissal', () => {
  const openers = [
    ['language', () => click(t.language)],
    ['settings', () => click(t.settings)],
    ['about', async () => (await click(t.settings), click(t.about, dialog()))],
    ['clear-data confirmation', () => click(t.clearLocalDataLabel)],
    ['export result', () => click(t.exportJsonLabel)],
    ['import', () => pickFile('backup.txt', '')],
  ]

  it('has nothing to close while no dialog is open', () => {
    render()
    expect(modalBackRef.current).toBeNull()
  })

  it.each(openers)('closes the %s dialog', async (_name, open) => {
    render()
    await open()
    expect(dialog()).not.toBeNull()
    act(() => modalBackRef.current())
    expect(dialog()).toBeNull()
    expect(modalBackRef.current).toBeNull()
  })

  it.each(openers)('closes the %s dialog when it is dismissed', async (_name, open) => {
    render()
    await open()
    const onOpenChange = seen.openDialogs.at(-1)
    act(() => onOpenChange(false))
    expect(dialog()).toBeNull()
  })

  it('works without a back-button registry', async () => {
    render({ modalBackRef: undefined })
    await click(t.language)
    expect(dialog()).not.toBeNull()
  })
})

describe('HomeScreen — onboarding tour', () => {
  it('shows no tap guide by default', () => {
    render()
    expect(container.textContent).not.toContain('👆')
  })

  it('puts the tap guide on the people button', () => {
    render({ tourTarget: SCREENS.people })
    expect(find(t.viewEditPeople).textContent).toContain('👆')
    expect(find(t.viewEditPeople).style.position).toBe('relative')
    expect(find(t.addNewPerson).textContent).not.toContain('👆')
  })

  it('puts the tap guide on the add-person button', () => {
    render({ tourTarget: SCREENS.add })
    expect(find(t.addNewPerson).textContent).toContain('👆')
    expect(find(t.addNewPerson).style.position).toBe('relative')
    expect(find(t.viewEditPeople).textContent).not.toContain('👆')
  })

  it('marks no button as a tour target by default', () => {
    render()
    expect(container.querySelector('[data-tour-target]')).toBeNull()
    expect(find(t.addNewPerson).style.pointerEvents).toBe('')
    expect(find(t.viewEditPeople).style.pointerEvents).toBe('')
  })

  it.each([
    [SCREENS.add, t.addNewPerson, t.viewEditPeople],
    [SCREENS.people, t.viewEditPeople, t.addNewPerson],
  ])(
    'leaves only the guided %s button reachable for the tour, and still tappable',
    async (tourTarget, guided, other) => {
      render({ tourTarget })
      expect([...container.querySelectorAll('[data-tour-target]')]).toEqual([find(guided)])
      expect(find(guided).style.pointerEvents).toBe('auto')
      expect(find(other).style.pointerEvents).toBe('')
      await click(guided)
      expect(handlers.onNavigate).toHaveBeenCalledWith(tourTarget)
    }
  )
})

describe('HomeScreen — tags', () => {
  const tags = { howWeMet: ['App'], nationality: [], situation: [], place: ['Park'] }

  async function openTags(props = {}) {
    render({ tags, onRemoveTag: vi.fn(), ...props })
    await click(t.settings)
    await click(t.manageTags, dialog())
  }

  // The confirmation is the real Radix alert dialog, portaled to the body.
  const alert = () => document.querySelector('[role="alertdialog"]')
  const requestParkDelete = async () => {
    await click(t.eventPlace, dialog())
    await click(`${t.deleteTag}: Park`, dialog())
  }

  it('moves from settings to the tags dialog', async () => {
    await openTags()
    expect(container.querySelectorAll('[data-dialog]')).toHaveLength(1)
    expect(dialog().textContent).toContain(t.manageTags)
  })

  it('opens without tag lists, as in the onboarding tour', async () => {
    render()
    await click(t.settings)
    await click(t.manageTags, dialog())
    expect(dialog().textContent).toContain(t.manageTags)
  })

  it('deletes a tag once the delete is confirmed', async () => {
    const onRemoveTag = vi.fn()
    await openTags({ onRemoveTag })
    await requestParkDelete()
    expect(onRemoveTag).not.toHaveBeenCalled()
    await click(t.deleteTagConfirmAction, alert())
    expect(onRemoveTag).toHaveBeenCalledWith('place', 'Park')
    expect(alert()).toBeNull()
    expect(dialog()).not.toBeNull()
  })

  it('asks to delete a tag in use anyway, with how many events use it', async () => {
    const onRemoveTag = vi.fn()
    const carla = { id: 'carla', name: 'Carla', events: [{ id: 'c1', place: 'park' }] }
    await openTags({ onRemoveTag, people: [ana, carla] })
    await requestParkDelete()
    expect(alert().textContent).toContain(`${t.deleteTagInUse} 1 ${t.tagEvent}.`)
    await click(t.deleteTagAnywayAction, alert())
    expect(onRemoveTag).toHaveBeenCalledWith('place', 'Park')
  })

  it('closes the confirmation first and then the dialog from the back button', async () => {
    const onRemoveTag = vi.fn()
    await openTags({ onRemoveTag })
    await requestParkDelete()
    expect(alert()).not.toBeNull()

    act(() => modalBackRef.current())
    expect(alert()).toBeNull()
    expect(dialog()).not.toBeNull()

    act(() => modalBackRef.current())
    expect(dialog()).toBeNull()
    expect(modalBackRef.current).toBeNull()
    expect(onRemoveTag).not.toHaveBeenCalled()
  })
})

describe('HomeScreen — app guide and onboarding restart', () => {
  it('moves from settings to the app guide', async () => {
    render()
    await click(t.settings)
    await click(t.appGuide, dialog())
    expect(container.querySelectorAll('[data-dialog]')).toHaveLength(1)
    expect(dialog().textContent).toContain(t.appGuideIntro)
    expect(dialog().textContent).toContain(t.guideDataExport)
  })

  it('closes the app guide from its button and from the back button', async () => {
    render()
    await click(t.settings)
    await click(t.appGuide, dialog())
    await click(t.close, dialog())
    expect(dialog()).toBeNull()

    await click(t.settings)
    await click(t.appGuide, dialog())
    act(() => modalBackRef.current())
    expect(dialog()).toBeNull()
    expect(modalBackRef.current).toBeNull()
  })

  it('offers no onboarding restart unless it can be restarted', async () => {
    render()
    await click(t.settings)
    expect(find(t.restartOnboarding, dialog())).toBeUndefined()
  })

  it('restarts the onboarding from settings and closes them', async () => {
    const onRestartOnboarding = vi.fn()
    render({ onRestartOnboarding })
    await click(t.settings)
    await click(t.restartOnboarding, dialog())
    expect(onRestartOnboarding).toHaveBeenCalledOnce()
    expect(dialog()).toBeNull()
  })
})

describe('HomeScreen — onboarding hints', () => {
  const hint = { title: 'Hint title', body: 'Hint body' }
  const notes = () => [...container.querySelectorAll('[role="note"]')]

  it('shows no hint by default, even with a hint text', () => {
    render({ tourHint: hint })
    expect(notes()).toHaveLength(0)
  })

  it('shows the data hint right above the data buttons', () => {
    render({ tourTarget: TOUR_TARGETS.data, tourHint: hint })
    expect(notes()).toHaveLength(1)
    expect(notes()[0].textContent).toBe('Hint titleHint body')
    expect(notes()[0].nextElementSibling.contains(find(t.exportJsonLabel))).toBe(true)
  })

  it('shows the settings hint inside the hero card, pointing at its right side', () => {
    render({ tourTarget: TOUR_TARGETS.settings, tourHint: hint })
    expect(notes()).toHaveLength(1)
    expect(notes()[0].textContent).toBe('Hint titleHint body')
    expect(notes()[0].querySelector('[aria-hidden="true"]').style.right).not.toBe('')
    expect(
      notes()[0].compareDocumentPosition(find(t.settings)) & Node.DOCUMENT_POSITION_PRECEDING
    ).toBeTruthy()
  })
})

describe('HomeScreen — onboarding spotlight', () => {
  const hint = { title: 'Hint title', body: 'Hint body' }
  const lifted = (node) => node.style.zIndex === String(TOUR_LAYERS.raised)

  it('lifts nothing by default', () => {
    render()
    expect([...container.querySelectorAll('button')].some(lifted)).toBe(false)
  })

  it('lifts the data hint with export and import, but not clear', () => {
    render({ tourTarget: TOUR_TARGETS.data, tourHint: hint })
    expect(lifted(container.querySelector('[role="note"]'))).toBe(true)
    expect(lifted(find(t.exportJsonLabel))).toBe(true)
    expect(lifted(find(t.importJsonLabel))).toBe(true)
    expect(lifted(find(t.clearLocalDataLabel))).toBe(false)
    expect(lifted(find(t.settings))).toBe(false)
  })

  it('lifts the settings hint with the settings button only', () => {
    render({ tourTarget: TOUR_TARGETS.settings, tourHint: hint })
    expect(lifted(container.querySelector('[role="note"]'))).toBe(true)
    expect(lifted(find(t.settings))).toBe(true)
    expect(lifted(find(t.language))).toBe(false)
    expect(lifted(find(t.exportJsonLabel))).toBe(false)
  })
})

describe('HomeScreen — onboarding done notice', () => {
  it('stays hidden by default', () => {
    render()
    expect(dialog()).toBeNull()
  })

  it('shows the notice and closes it from its button', async () => {
    const onCloseOnboardingDone = vi.fn()
    render({ onboardingDoneOpen: true, onCloseOnboardingDone })
    expect(dialog().textContent).toContain(t.onboardingDoneTitle)
    expect(dialog().textContent).toContain(t.onboardingDoneBody)
    await click(t.onboardingDoneAction, dialog())
    expect(onCloseOnboardingDone).toHaveBeenCalledOnce()
  })

  it('dims the screen behind the notice with the tour backdrop and offers no close button', () => {
    render({ onboardingDoneOpen: true, onCloseOnboardingDone: vi.fn() })
    expect(seen.dialogContent.overlayStyle).toEqual({ backgroundColor: 'rgb(1, 2, 3)' })
    expect(seen.dialogContent.showCloseButton).toBe(false)
  })

  it('closes the notice when it is dismissed or from the back button', () => {
    const onCloseOnboardingDone = vi.fn()
    render({ onboardingDoneOpen: true, onCloseOnboardingDone })
    act(() => seen.openDialogs.at(-1)(true))
    expect(onCloseOnboardingDone).not.toHaveBeenCalled()
    act(() => seen.openDialogs.at(-1)(false))
    act(() => modalBackRef.current())
    expect(onCloseOnboardingDone).toHaveBeenCalledTimes(2)
  })
})
