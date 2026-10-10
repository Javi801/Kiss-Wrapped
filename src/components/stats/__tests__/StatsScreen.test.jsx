// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

const mockFeatures = vi.hoisted(() => ({ pdfExport: true, onboarding: false }))
const mockPdf = vi.hoisted(() => ({ exportStatsPdf: vi.fn(), saveErrorLog: vi.fn() }))
const tabs = vi.hoisted(() => ({}))
const dialogs = vi.hoisted(() => ({ open: [] }))

vi.mock('@/lib/config', async (importOriginal) => ({
  ...(await importOriginal()),
  FEATURES: mockFeatures,
}))
vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/lib/pdf-export', () => mockPdf)
// Only open dialogs render, each exposing its onOpenChange handler.
vi.mock('@/components/ui/dialog', async () => {
  const { createElement } = await import('react')
  const passthrough = ({ children }) => children
  return {
    Dialog: ({ open, onOpenChange, children }) => {
      if (!open) return null
      dialogs.open.push(onOpenChange)
      return createElement('div', { 'data-dialog': true }, children)
    },
    DialogContent: passthrough,
    DialogHeader: passthrough,
    DialogTitle: passthrough,
    DialogDescription: passthrough,
    DialogFooter: passthrough,
  }
})

function mockTab(name) {
  return async () => {
    const { createElement } = await import('react')
    return {
      default: (props) => {
        tabs[name] = props
        return createElement('div', { 'data-tab': name })
      },
    }
  }
}

vi.mock('@/components/stats/StatsOverviewTab', mockTab('overview'))
vi.mock('@/components/stats/StatsTimeTab', mockTab('time'))
vi.mock('@/components/stats/StatsPeopleTab', mockTab('people'))
vi.mock('@/components/stats/StatsScoresTab', mockTab('scores'))

import StatsScreen from '@/components/stats/StatsScreen'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

const ana = {
  id: 'ana',
  name: 'Ana',
  partnerStatus: 'never',
  events: [
    { id: 'a1', date: '2024.01.01' },
    { id: 'a2', date: '2024.02.01' },
  ],
}
// Past partner during 2023: only the 2022 event counts for event statistics.
const mia = {
  id: 'mia',
  name: 'Mia',
  partnerStatus: 'past',
  partnerFrom: '2023.01.01',
  partnerTo: '2023.12.31',
  events: [
    { id: 'm1', date: '2022.06.01' },
    { id: 'm2', date: '2023.06.01' },
  ],
}
// Current partner with no start date: every event is inside the period.
const zoe = {
  id: 'zoe',
  name: 'Zoe',
  partnerStatus: 'current',
  partnerFrom: '',
  events: [{ id: 'z1', date: '2024.03.01' }],
}

let container
let root

function render(people, props = {}) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<StatsScreen people={people} t={t} language="en" {...props} />)
  })
}

const visibleTabs = () =>
  [...container.querySelectorAll('[data-tab]')].map((node) => node.dataset.tab)
const dialog = () => container.querySelector('[data-dialog]')
const button = (label) =>
  [...container.querySelectorAll('button')].find((item) => item.textContent.includes(label))
const click = (label, scope = container) =>
  act(async () => {
    const target = [...scope.querySelectorAll('button')].find((item) =>
      item.textContent.includes(label)
    )
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

beforeEach(() => {
  vi.clearAllMocks()
  for (const key of Object.keys(tabs)) delete tabs[key]
  dialogs.open = []
  mockFeatures.pdfExport = true
  mockPdf.exportStatsPdf.mockResolvedValue(undefined)
  mockPdf.saveErrorLog.mockResolvedValue(undefined)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('StatsScreen — tabs', () => {
  it('opens on the overview tab', () => {
    render([ana])
    expect(visibleTabs()).toEqual(['overview'])
    expect(container.textContent).toContain(t.statsGroupOverview)
  })

  it.each([
    ['time', t.time, t.statsGroupTime],
    ['people', t.profilesStats, t.statsGroupProfiles],
    ['scores', t.scores, t.statsGroupScores],
  ])('switches to the %s tab and describes it', async (tab, label, helper) => {
    render([ana])
    await click(label)
    expect(visibleTabs()).toEqual([tab])
    expect(container.textContent).toContain(helper)
  })
})

describe('StatsScreen — shared datasets', () => {
  it('leaves partner-period events out of the event-based tabs', async () => {
    render([ana, mia, zoe])
    expect(tabs.overview.people.map((person) => person.id)).toEqual(['ana', 'mia'])
    expect(tabs.overview.allEvents.map((event) => event.id)).toEqual(['a1', 'a2', 'm1'])

    await click(t.time)
    expect(tabs.time.people.map((person) => person.id)).toEqual(['ana', 'mia'])
    expect(tabs.time.allEvents.map((event) => event.id)).toEqual(['a1', 'a2', 'm1'])
    expect(tabs.time.language).toBe('en')

    await click(t.scores)
    expect(tabs.scores.allEvents.map((event) => event.id)).toEqual(['a1', 'a2', 'm1'])
  })

  it('gives the people tab everyone plus the event-based list', async () => {
    const people = [ana, mia, zoe]
    render(people)
    await click(t.profilesStats)
    expect(tabs.people.people).toBe(people)
    expect(tabs.people.eventPeople.map((person) => person.id)).toEqual(['ana', 'mia'])
    expect(tabs.people.language).toBe('en')
  })

  it('links every event to its person', () => {
    render([ana, mia])
    expect(tabs.overview.allEvents.map((event) => event.person.id)).toEqual(['ana', 'ana', 'mia'])
  })

  it('handles an empty dataset', () => {
    render([])
    expect(tabs.overview.people).toEqual([])
    expect(tabs.overview.allEvents).toEqual([])
  })
})

describe('StatsScreen — partner events toggle', () => {
  const everyEvent = ['a1', 'a2', 'm1', 'm2', 'z1']

  it('keeps partner-period events in every tab when they are included', async () => {
    const people = [ana, mia, zoe]
    render(people, { includePartnerEvents: true })
    expect(tabs.overview.people).toBe(people)
    expect(tabs.overview.allEvents.map((event) => event.id)).toEqual(everyEvent)

    await click(t.time)
    expect(tabs.time.people).toBe(people)
    expect(tabs.time.allEvents.map((event) => event.id)).toEqual(everyEvent)

    await click(t.profilesStats)
    expect(tabs.people.people).toBe(people)
    expect(tabs.people.eventPeople).toBe(people)

    await click(t.scores)
    expect(tabs.scores.allEvents.map((event) => event.id)).toEqual(everyEvent)
  })

  it('recomputes the datasets of the open tab when the choice changes', () => {
    const people = [ana, mia, zoe]
    render(people, { includePartnerEvents: false })
    expect(tabs.overview.allEvents.map((event) => event.id)).toEqual(['a1', 'a2', 'm1'])

    act(() => {
      root.render(<StatsScreen people={people} t={t} language="en" includePartnerEvents={true} />)
    })
    expect(tabs.overview.allEvents.map((event) => event.id)).toEqual(everyEvent)
  })

  it.each([
    [false, 'false'],
    [true, 'true'],
  ])('shows the toggle pressed state for includePartnerEvents=%s', (value, pressed) => {
    render([ana, mia], { includePartnerEvents: value })
    expect(button(t.includePartnerEvents).getAttribute('aria-pressed')).toBe(pressed)
  })

  it('flips the choice when the toggle is clicked', async () => {
    const setIncludePartnerEvents = vi.fn()
    render([ana, mia], { includePartnerEvents: false, setIncludePartnerEvents })
    await click(t.includePartnerEvents)
    expect(setIncludePartnerEvents).toHaveBeenCalledOnce()
    const update = setIncludePartnerEvents.mock.calls[0][0]
    expect(update(false)).toBe(true)
    expect(update(true)).toBe(false)
  })

  it('hides the toggle when nobody has a partner period', () => {
    render([ana], { includePartnerEvents: false })
    expect(button(t.includePartnerEvents)).toBeUndefined()
  })
})

describe('StatsScreen — PDF export', () => {
  it('hides the export button while the feature is off', () => {
    mockFeatures.pdfExport = false
    render([ana])
    expect(button(t.exportPdf)).toBeUndefined()
  })

  it.each([
    ['there are no people', []],
    [
      'nobody has events',
      [
        { id: 'new', name: 'New', events: [] },
        { id: 'old', name: 'Old' },
      ],
    ],
  ])('explains that there is nothing to export when %s', async (_case, people) => {
    render(people)
    await click(t.exportPdf)
    expect(mockPdf.exportStatsPdf).not.toHaveBeenCalled()
    expect(dialog().textContent).toContain(t.pdfEmptyTitle)
  })

  it('exports the people in the current language and confirms it', async () => {
    const people = [ana, mia]
    render(people)
    await click(t.exportPdf)
    expect(mockPdf.exportStatsPdf).toHaveBeenCalledWith(people, t, 'en')
    expect(dialog().textContent).toContain(t.pdfSuccessTitle)
  })

  it('reports a failed export', async () => {
    mockPdf.exportStatsPdf.mockRejectedValue(new Error('no space'))
    render([ana])
    await click(t.exportPdf)
    expect(dialog().textContent).toContain(t.pdfErrorTitle)
    expect(dialog().textContent).not.toContain(t.pdfSuccessTitle)
  })

  it('saves the error log of a failed export and closes the dialog', async () => {
    const failure = new Error('no space')
    mockPdf.exportStatsPdf.mockRejectedValue(failure)
    render([ana])
    await click(t.exportPdf)
    await click(t.savePdfErrorLog, dialog())
    expect(mockPdf.saveErrorLog).toHaveBeenCalledWith(failure)
    expect(dialog()).toBeNull()
  })

  it('wraps a failure that is not an Error before logging it', async () => {
    mockPdf.exportStatsPdf.mockRejectedValue('plain failure')
    render([ana])
    await click(t.exportPdf)
    await click(t.savePdfErrorLog, dialog())
    const logged = mockPdf.saveErrorLog.mock.calls[0][0]
    expect(logged).toBeInstanceOf(Error)
    expect(logged.message).toBe('plain failure')
  })

  it('does not log anything when the error dialog is just closed', async () => {
    mockPdf.exportStatsPdf.mockRejectedValue(new Error('no space'))
    render([ana])
    await click(t.exportPdf)
    await click(t.close, dialog())
    expect(mockPdf.saveErrorLog).not.toHaveBeenCalled()
    expect(dialog()).toBeNull()
  })

  it.each([
    ['empty', []],
    ['success', [ana]],
  ])('closes the %s dialog from its close button', async (_case, people) => {
    render(people)
    await click(t.exportPdf)
    await click(t.close, dialog())
    expect(dialog()).toBeNull()
  })

  it('closes the dialog when it is dismissed', async () => {
    render([ana])
    await click(t.exportPdf)
    const onOpenChange = dialogs.open.at(-1)
    act(() => onOpenChange(true))
    expect(dialog()).not.toBeNull()
    act(() => onOpenChange(false))
    expect(dialog()).toBeNull()
  })
})

describe('StatsScreen — hardware back button', () => {
  it('registers a closer only while a dialog is open', async () => {
    const modalBackRef = { current: null }
    render([ana], { modalBackRef })
    expect(modalBackRef.current).toBeNull()

    await click(t.exportPdf)
    expect(modalBackRef.current).toEqual(expect.any(Function))

    act(() => modalBackRef.current())
    expect(dialog()).toBeNull()
    expect(modalBackRef.current).toBeNull()
  })

  it('works without a back-button registry', async () => {
    render([ana])
    await click(t.exportPdf)
    expect(dialog().textContent).toContain(t.pdfSuccessTitle)
  })
})
