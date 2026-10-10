// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

const seen = vi.hoisted(() => ({ openDialogs: [] }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/lib/device-storage', () => ({ exportPeopleJson: vi.fn() }))
vi.mock('@/lib/pdf-export', () => ({ saveErrorLog: vi.fn() }))
vi.mock('@/components/app/ColorSelector', () => ({ default: () => null }))
vi.mock('@/components/shared/StatTile', () => ({ default: () => null }))
// Only open dialogs render, each exposing its onOpenChange handler.
vi.mock('@/components/ui/dialog', async () => {
  const { createElement } = await import('react')
  const passthrough = ({ children }) => children
  return {
    Dialog: ({ open, onOpenChange, children }) => {
      if (!open) return null
      seen.openDialogs.push(onOpenChange)
      return createElement('div', { 'data-dialog': true }, children)
    },
    DialogContent: passthrough,
    DialogHeader: passthrough,
    DialogTitle: passthrough,
    DialogDescription: passthrough,
    DialogFooter: passthrough,
  }
})
vi.mock('@/components/ui/date-picker', async () => {
  const { createElement } = await import('react')
  return {
    DatePicker: ({ value, onChange }) =>
      createElement('input', {
        'data-testid': 'partner-date',
        value,
        onChange: (event) => onChange(event.target.value),
      }),
  }
})

import MainScreen from '@/components/app/HomeScreen'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en
const FUTURE_DATE = '2999.01.01'

// Already saved.
const ana = { id: 'ana', name: 'Ana', events: [] }

// New and valid.
const mia = { id: 'mia', name: 'Mia', partnerStatus: 'never', events: [] }
const lia = {
  id: 'lia',
  name: 'Lia',
  partnerStatus: 'past',
  partnerFrom: '2020.01.01',
  partnerTo: '2021.01.01',
  events: [],
}

// New with invalid partner data.
const unknownStatus = {
  id: 'uma',
  name: 'Uma',
  partnerStatus: 'ex',
  events: [{ id: 'u1' }, { id: 'u2' }],
}
const missingEnd = {
  id: 'noe',
  name: 'Noe',
  partnerStatus: 'past',
  partnerFrom: '2020.01.01',
  events: [{ id: 'n1' }],
}

let container
let root
let onImportData
let modalBackRef

function render() {
  onImportData = vi.fn()
  modalBackRef = { current: null }
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <MainScreen
        people={[ana]}
        t={t}
        language="en"
        iconColor="yellow"
        theme="pink"
        statsVisible
        modalBackRef={modalBackRef}
        onNavigate={vi.fn()}
        onClearData={vi.fn()}
        onImportData={onImportData}
        setLanguage={vi.fn()}
        setIconColor={vi.fn()}
        setTheme={vi.fn()}
        setStatsVisible={vi.fn()}
      />
    )
  })
}

const dialog = () => container.querySelector('[data-dialog]')
const button = (label, scope = dialog()) =>
  [...scope.querySelectorAll('button')].find((item) => item.textContent.includes(label))
const click = (label, scope) => act(() => button(label, scope).click())

// Simulates the user picking a JSON file with the given people.
function importJson(data) {
  const input = container.querySelector('input[type="file"]')
  const file = { name: 'backup.json', text: async () => JSON.stringify(data) }
  Object.defineProperty(input, 'files', { configurable: true, value: [file] })
  return act(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

// Imports the file and opens the fix table.
async function openTable(data) {
  render()
  await importJson(data)
  click(t.importPartnerFix)
}

const rows = () => [...dialog().querySelectorAll('[data-import-row]')]
const row = (name) => rows().find((item) => item.textContent.includes(name))
const pressedStatus = (name) =>
  [...row(name).querySelectorAll('button[aria-pressed="true"]')].map((item) => item.textContent)
const dateInputs = (name) => [...row(name).querySelectorAll('[data-testid="partner-date"]')]
const discardBox = (name) => row(name).querySelector('input[type="checkbox"]')
const toggleDiscard = (name) => act(() => discardBox(name).click())
const importButton = () => button(t.importJsonConfirmAction)

// Sets the value the way React expects so the change handler fires.
function typeDate(input, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  act(() => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

beforeEach(() => {
  seen.openDialogs = []
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('HomeScreen — import without partner issues', () => {
  it('follows the current confirmation flow', async () => {
    render()
    await importJson([mia, lia])
    expect(dialog().textContent).toContain(t.importJsonConfirmTitle)
    expect(dialog().textContent).not.toContain(t.importPartnerIssuesTitle)
    click(t.importJsonConfirmAction)
    expect(onImportData).toHaveBeenCalledWith([mia, lia])
    expect(dialog().textContent).not.toContain(t.importJsonSuccessSkipped)
    expect(dialog().textContent).not.toContain(t.importJsonSuccessDiscarded)
  })

  it('does not treat a legacy isPartner record as a problem', async () => {
    render()
    await importJson([{ id: 'leo', name: 'Leo', isPartner: true, events: [] }])
    expect(dialog().textContent).toContain(t.importJsonConfirmTitle)
  })
})

describe('HomeScreen — partner issues notice', () => {
  it('replaces the confirmation and shows the counts', async () => {
    render()
    await importJson([mia, unknownStatus, missingEnd])
    const text = dialog().textContent
    expect(text).toContain(t.importPartnerIssuesTitle)
    expect(text).not.toContain(t.importJsonConfirmTitle)
    expect(text).toContain(`3 ${t.importJsonConfirmPeople}`)
    expect(text).toContain(`3 ${t.importJsonConfirmNew}`)
    expect(text).not.toContain(t.importJsonConfirmSkipped)
    expect(text).toContain(`2 ${t.importPartnerIssuesCount}`)
  })

  it('does not count problems of people that are already saved', async () => {
    render()
    await importJson([{ ...ana, partnerStatus: 'ex' }, mia, unknownStatus])
    const text = dialog().textContent
    expect(text).toContain(`3 ${t.importJsonConfirmPeople}`)
    expect(text).toContain(`2 ${t.importJsonConfirmNew}`)
    expect(text).toContain(`1 ${t.importJsonConfirmSkipped}`)
    expect(text).toContain(`1 ${t.importPartnerIssuesCount}`)
  })

  it('shows the normal confirmation when only saved people have problems', async () => {
    render()
    await importJson([{ ...ana, partnerStatus: 'ex' }, mia])
    expect(dialog().textContent).toContain(t.importJsonConfirmTitle)
  })

  it.each([
    ['an unknown status', { partnerStatus: 'ex' }],
    ['an invalid date', { partnerStatus: 'current', partnerFrom: '2020-01-01' }],
    ['a date that is not a string', { partnerStatus: 'current', partnerFrom: 20200101 }],
    ['a past partner without an end', { partnerStatus: 'past' }],
    [
      'an inverted range',
      { partnerStatus: 'past', partnerFrom: '2022.01.01', partnerTo: '2021.01.01' },
    ],
    ['a future date', { partnerStatus: 'current', partnerFrom: FUTURE_DATE }],
  ])('detects %s', async (_case, partner) => {
    render()
    await importJson([{ id: 'zoe', name: 'Zoe', events: [], ...partner }])
    expect(dialog().textContent).toContain(t.importPartnerIssuesTitle)
  })

  it('imports only the valid people when skipping', async () => {
    render()
    await importJson([unknownStatus, mia, missingEnd, lia])
    click(t.importPartnerSkipAction)
    expect(onImportData).toHaveBeenCalledOnce()
    expect(onImportData).toHaveBeenCalledWith([mia, lia])
    const text = dialog().textContent
    expect(text).toContain(t.importJsonSuccessTitle)
    expect(text).toContain(`2 ${t.importJsonSuccessDesc}`)
    expect(text).toContain(`2 ${t.importJsonSuccessSkipped}`)
    expect(text).not.toContain(t.importJsonSuccessDiscarded)
  })

  it('labels the skip button with both counts', async () => {
    render()
    await importJson([unknownStatus, mia, missingEnd, lia])
    expect(button(t.importPartnerSkipAction).textContent).toBe(
      `${t.importJsonConfirmAction} 2 ${t.importPartnerSkipAction} 2`
    )
  })

  it('hides the skip button when every new person has problems', async () => {
    render()
    await importJson([unknownStatus, missingEnd])
    expect(button(t.importPartnerSkipAction)).toBeUndefined()
    expect(button(t.importPartnerFix)).toBeDefined()
    expect(button(t.cancel)).toBeDefined()
  })

  it('imports nothing when cancelled', async () => {
    render()
    await importJson([mia, unknownStatus])
    click(t.cancel)
    expect(onImportData).not.toHaveBeenCalled()
    expect(dialog()).toBeNull()
  })

  it('imports nothing when dismissed', async () => {
    render()
    await importJson([mia, unknownStatus])
    act(() => seen.openDialogs.at(-1)(false))
    expect(onImportData).not.toHaveBeenCalled()
    expect(dialog()).toBeNull()
  })

  it('closes with the back button', async () => {
    render()
    await importJson([mia, unknownStatus])
    act(() => modalBackRef.current())
    expect(dialog()).toBeNull()
    expect(onImportData).not.toHaveBeenCalled()
  })
})

describe('HomeScreen — partner fix table', () => {
  it('lists only the people with problems, with their event count', async () => {
    await openTable([mia, unknownStatus, missingEnd])
    expect(rows()).toHaveLength(2)
    expect(row('Mia')).toBeUndefined()
    expect(row('Uma').textContent).toContain(`2 ${t.events}`)
    expect(row('Noe').textContent).toContain(`1 ${t.events}`)
  })

  it('starts a row with an unknown status with no status selected', async () => {
    await openTable([unknownStatus])
    expect(pressedStatus('Uma')).toEqual([])
    expect(dateInputs('Uma')).toHaveLength(0)
    expect(row('Uma').textContent).toContain(t.requiredPartnerStatus)
  })

  it('prefills a row with the data that came valid and shows its error', async () => {
    await openTable([missingEnd])
    expect(pressedStatus('Noe')).toEqual([t.partnerPast])
    expect(dateInputs('Noe').map((input) => input.value)).toEqual(['2020.01.01', ''])
    expect(row('Noe').textContent).toContain(t.requiredPartnerTo)
  })

  it('shows the errors of each row separately', async () => {
    await openTable([unknownStatus, missingEnd])
    expect(row('Uma').textContent).not.toContain(t.requiredPartnerTo)
    expect(row('Noe').textContent).not.toContain(t.requiredPartnerStatus)
  })

  it('keeps the import button disabled until every row is resolved', async () => {
    await openTable([mia, unknownStatus, missingEnd])
    expect(importButton().disabled).toBe(true)
    expect(dialog().textContent).toContain(`2 ${t.importPartnerLeftToResolve}`)

    click(t.partnerNever, row('Uma'))
    expect(importButton().disabled).toBe(true)
    expect(dialog().textContent).toContain(`1 ${t.importPartnerLeftToResolve}`)

    typeDate(dateInputs('Noe')[1], '2021.01.01')
    expect(importButton().disabled).toBe(false)
    expect(dialog().textContent).not.toContain(t.importPartnerLeftToResolve)
    expect(row('Noe').textContent).not.toContain(t.requiredPartnerTo)
  })

  it('validates the edited dates of a row', async () => {
    await openTable([missingEnd])
    typeDate(dateInputs('Noe')[1], '2019.01.01')
    expect(row('Noe').textContent).toContain(t.partnerRangeError)
    expect(importButton().disabled).toBe(true)
    typeDate(dateInputs('Noe')[1], FUTURE_DATE)
    expect(row('Noe').textContent).toContain(t.futureDateMsg)
    typeDate(dateInputs('Noe')[1], 'bad')
    expect(row('Noe').textContent).toContain(t.validDateMsg)
  })

  it('imports the valid people and the fixed rows in file order', async () => {
    await openTable([unknownStatus, mia, missingEnd])
    click(t.partnerCurrent, row('Uma'))
    typeDate(dateInputs('Uma')[0], '2023.05.01')
    typeDate(dateInputs('Noe')[1], '2021.01.01')
    act(() => importButton().click())

    expect(onImportData).toHaveBeenCalledOnce()
    expect(onImportData).toHaveBeenCalledWith([
      { ...unknownStatus, partnerStatus: 'current', partnerFrom: '2023.05.01', partnerTo: '' },
      mia,
      { ...missingEnd, partnerStatus: 'past', partnerFrom: '2020.01.01', partnerTo: '2021.01.01' },
    ])
    const text = dialog().textContent
    expect(text).toContain(t.importJsonSuccessTitle)
    expect(text).toContain(`3 ${t.importJsonSuccessDesc}`)
    expect(text).not.toContain(t.importJsonSuccessSkipped)
    expect(text).not.toContain(t.importJsonSuccessDiscarded)
  })

  it('clears the dates the chosen status does not use', async () => {
    await openTable([missingEnd])
    click(t.partnerNever, row('Noe'))
    act(() => importButton().click())
    expect(onImportData).toHaveBeenCalledWith([
      { ...missingEnd, partnerStatus: 'never', partnerFrom: '', partnerTo: '' },
    ])
  })

  it('shows the import and discard summary', async () => {
    await openTable([mia, unknownStatus, missingEnd])
    expect(dialog().textContent).toContain(
      `${t.importJsonConfirmAction} 3 · ${t.importPartnerSummaryDiscard} 0`
    )
    toggleDiscard('Uma')
    expect(dialog().textContent).toContain(
      `${t.importJsonConfirmAction} 2 · ${t.importPartnerSummaryDiscard} 1`
    )
    expect(importButton().textContent).toBe(`${t.importJsonConfirmAction} 2`)
  })

  it('counts a discarded row as resolved and leaves it out of the import', async () => {
    await openTable([mia, unknownStatus])
    expect(importButton().disabled).toBe(true)
    toggleDiscard('Uma')
    expect(discardBox('Uma').checked).toBe(true)
    expect(row('Uma').querySelector('fieldset').disabled).toBe(true)
    expect(row('Uma').textContent).not.toContain(t.requiredPartnerStatus)
    expect(importButton().disabled).toBe(false)

    act(() => importButton().click())
    expect(onImportData).toHaveBeenCalledWith([mia])
    const text = dialog().textContent
    expect(text).toContain(`1 ${t.importJsonSuccessDesc}`)
    expect(text).toContain(`1 ${t.importJsonSuccessDiscarded}`)
  })

  it('restores a discarded row with its edits', async () => {
    await openTable([mia, missingEnd])
    typeDate(dateInputs('Noe')[0], '2019.06.01')
    toggleDiscard('Noe')
    toggleDiscard('Noe')
    expect(discardBox('Noe').checked).toBe(false)
    expect(row('Noe').querySelector('fieldset').disabled).toBe(false)
    expect(dateInputs('Noe')[0].value).toBe('2019.06.01')
    expect(row('Noe').textContent).toContain(t.requiredPartnerTo)
    expect(importButton().disabled).toBe(true)
  })

  it('has nothing to import when every row is discarded and no one else is valid', async () => {
    await openTable([unknownStatus, missingEnd])
    toggleDiscard('Uma')
    toggleDiscard('Noe')
    expect(importButton().disabled).toBe(true)
    expect(dialog().textContent).toContain(t.importPartnerNothingToImport)
    expect(dialog().textContent).not.toContain(t.importPartnerLeftToResolve)
  })

  it('has no cancel button', async () => {
    await openTable([unknownStatus])
    expect(button(t.cancel)).toBeUndefined()
    expect(button(t.back)).toBeDefined()
  })
})

describe('HomeScreen — leaving the partner fix table', () => {
  const leave = [
    ['the Back button', () => click(t.back)],
    ['the hardware back button', () => act(() => modalBackRef.current())],
    ['dismissing the dialog', () => act(() => seen.openDialogs.at(-1)(false))],
  ]

  it.each(leave)('returns to the notice with %s and keeps the edits', async (_name, goBack) => {
    await openTable([mia, unknownStatus, missingEnd])
    click(t.partnerCurrent, row('Uma'))
    typeDate(dateInputs('Uma')[0], '2023.05.01')
    toggleDiscard('Noe')

    goBack()
    expect(dialog().textContent).toContain(`2 ${t.importPartnerIssuesCount}`)
    expect(rows()).toHaveLength(0)
    expect(onImportData).not.toHaveBeenCalled()

    click(t.importPartnerFix)
    expect(pressedStatus('Uma')).toEqual([t.partnerCurrent])
    expect(dateInputs('Uma')[0].value).toBe('2023.05.01')
    expect(discardBox('Noe').checked).toBe(true)
  })

  it('closes everything with a second back press', async () => {
    await openTable([unknownStatus])
    act(() => modalBackRef.current())
    act(() => modalBackRef.current())
    expect(dialog()).toBeNull()
    expect(modalBackRef.current).toBeNull()
  })

  it('can still skip the problems after going back', async () => {
    await openTable([mia, unknownStatus])
    click(t.partnerNever, row('Uma'))
    click(t.back)
    click(t.importPartnerSkipAction)
    expect(onImportData).toHaveBeenCalledWith([mia])
  })
})
