// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY, ZODIAC_OPTIONS } from '@/lib/constants'
import { formatShortDate } from '@/lib/date'

// Props of the forms currently mounted inside an open dialog.
const forms = vi.hoisted(() => ({ person: null, event: null }))
// onOpenChange handlers of the dialogs that are currently open.
const openDialogs = vi.hoisted(() => ({ current: [] }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/forms/PersonForm', () => ({
  default: (props) => {
    forms.person = props
    return null
  },
}))
vi.mock('@/components/forms/EventForm', () => ({
  default: (props) => {
    forms.event = props
    return null
  },
}))
vi.mock('framer-motion', async () => {
  const { createElement, Fragment } = await import('react')
  return {
    motion: {
      // Drops the animation props so they don't reach the DOM.
      // eslint-disable-next-line no-unused-vars
      div: ({ layout, initial, animate, exit, children, ...rest }) =>
        createElement('div', rest, children),
    },
    AnimatePresence: ({ children }) => createElement(Fragment, null, children),
  }
})
// Only open dialogs render their content.
vi.mock('@/components/ui/dialog', async () => {
  const { createElement } = await import('react')
  const passthrough = ({ children }) => children
  return {
    Dialog: ({ open, onOpenChange, children }) => {
      if (!open) return null
      openDialogs.current.push(onOpenChange)
      return createElement('div', { 'data-dialog': true }, children)
    },
    DialogContent: passthrough,
    DialogHeader: passthrough,
    DialogTitle: passthrough,
    DialogDescription: passthrough,
  }
})
vi.mock('@/components/ui/alert-dialog', async () => {
  const { createElement } = await import('react')
  const passthrough = ({ children }) => children
  return {
    AlertDialog: passthrough,
    AlertDialogTrigger: passthrough,
    AlertDialogContent: passthrough,
    AlertDialogHeader: passthrough,
    AlertDialogFooter: passthrough,
    AlertDialogTitle: () => null,
    AlertDialogDescription: () => null,
    AlertDialogCancel: () => null,
    AlertDialogAction: ({ onClick, children }) =>
      createElement('button', { type: 'button', onClick }, children),
  }
})

import PersonCard from '@/components/person/PersonCard'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

const complete = (overrides) => ({
  id: 'e1',
  date: '2024.01.10',
  place: 'Park',
  situation: 'Date',
  details: 'walk',
  score: null,
  ...overrides,
})

const basePerson = {
  id: 'mia',
  name: 'Mia',
  birthYear: 1995,
  gender: 'female',
  activity: 'works',
  zodiacSign: ZODIAC_OPTIONS.en[0],
  howWeMet: 'School',
  partnerStatus: 'never',
  partnerFrom: '',
  partnerTo: '',
  events: [],
}

let container
let root
let handlers

function renderCard(overrides, props = {}) {
  handlers = {
    onUpdatePerson: vi.fn(),
    onDeletePerson: vi.fn(),
    onAddEvent: vi.fn(),
    onUpdateEvent: vi.fn(),
    onDeleteEvent: vi.fn(),
    onDeleteAllEvents: vi.fn(),
  }
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <PersonCard
        person={{ ...basePerson, ...overrides }}
        t={t}
        language="en"
        {...handlers}
        {...props}
      />
    )
  })
}

// The header is the first button of the card; clicking it toggles the details.
const toggle = () => act(() => container.querySelector('button').click())
const buttons = () => [...container.querySelectorAll('button')]
const click = (label) =>
  act(() => {
    buttons()
      .find((item) => item.textContent.includes(label))
      .click()
  })
const dialog = () => container.querySelector('[data-dialog]')
const badgeTexts = () =>
  [...container.querySelectorAll('[data-slot="badge"]')].map((badge) => badge.textContent)
// Event rows are the buttons that show a date.
const eventRows = () => buttons().filter((item) => / 20\d\d/.test(item.textContent))

beforeEach(() => {
  forms.person = null
  forms.event = null
  openDialogs.current = []
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('PersonCard — header', () => {
  it('summarizes the person', () => {
    renderCard()
    const header = container.querySelector('button').textContent
    expect(header).toContain('Mia')
    expect(header).toContain(t.years)
    expect(header).toContain(t.female)
    expect(header).toContain(t.works)
    expect(header).toContain('Aquarius')
  })

  it('starts collapsed', () => {
    renderCard({ realName: 'Maria', events: [complete()] })
    expect(container.textContent).not.toContain('Maria')
    expect(container.textContent).not.toContain(t.editPerson)
    expect(eventRows()).toHaveLength(0)
  })

  it('collapses again when the header is tapped twice', () => {
    renderCard({ realName: 'Maria' })
    toggle()
    expect(container.textContent).toContain('Maria')
    toggle()
    expect(container.textContent).not.toContain('Maria')
  })

  it.each([
    ['without a place', { place: '' }],
    ['with a blank situation', { situation: '   ' }],
  ])('flags a person with an event %s', (_case, event) => {
    renderCard({ events: [complete(), complete({ id: 'e2', ...event })] })
    expect(badgeTexts()).toContain(t.missingEventDetailsBadge)
  })

  it('flags a person whose own profile is incomplete', () => {
    renderCard({ howWeMet: '', events: [complete()] })
    expect(badgeTexts()).toContain(t.missingEventDetailsBadge)
  })

  it('does not flag a complete person whose events are complete', () => {
    renderCard({ events: [complete()] })
    expect(badgeTexts()).not.toContain(t.missingEventDetailsBadge)
  })
})

describe('PersonCard — details', () => {
  it('shows the real name, how we met and the note', () => {
    renderCard({ realName: 'Maria', howWeMet: 'School', detail: 'likes tea' })
    toggle()
    expect(container.textContent).toContain(`${t.realName}: Maria`)
    expect(container.textContent).toContain(`${t.met}: School`)
    expect(container.textContent).toContain('likes tea')
  })

  it('omits the fields that are empty', () => {
    renderCard({ howWeMet: '' })
    toggle()
    expect(container.textContent).not.toContain(`${t.realName}:`)
    expect(container.textContent).not.toContain(`${t.met}:`)
  })

  it('says there are no events yet', () => {
    renderCard()
    toggle()
    expect(container.textContent).toContain(t.noEventsYet)
    expect(container.textContent).not.toContain(t.deleteAllEvents)
  })
})

describe('PersonCard — event list', () => {
  it('lists the events from newest to oldest without reordering the data', () => {
    const events = [
      complete({ id: 'old', date: '2022.03.01' }),
      complete({ id: 'new', date: '2024.07.01' }),
      complete({ id: 'mid', date: '2023.05.01' }),
    ]
    renderCard({ events })
    toggle()
    expect(eventRows().map((row) => row.textContent.match(/20\d\d/)[0])).toEqual([
      '2024',
      '2023',
      '2022',
    ])
    expect(events.map((event) => event.id)).toEqual(['old', 'new', 'mid'])
  })

  it('shows the date, place, situation, details and observations of an event', () => {
    renderCard({ events: [complete({ observations: 'rainy' })] })
    toggle()
    const row = eventRows()[0].textContent
    expect(row).toContain(formatShortDate('2024.01.10', 'en'))
    expect(row).toContain(`${t.eventPlace}: Park`)
    expect(row).toContain(`${t.eventSituation}: Date`)
    expect(row).toContain('walk')
    expect(row).toContain('rainy')
  })

  it('says when an event has no details', () => {
    renderCard({ events: [complete({ details: '' })] })
    toggle()
    expect(eventRows()[0].textContent).toContain(t.noDetailsAdded)
  })

  it('shows the score in kisses', () => {
    renderCard({ events: [complete({ score: 3 })] })
    toggle()
    expect(badgeTexts()).toContain('💋💋💋')
  })

  it('shows a score of zero as "no score"', () => {
    renderCard({ events: [complete({ score: 0 })] })
    toggle()
    expect(badgeTexts()).toContain(t.noScore)
  })

  it('shows no score badge for an unscored event', () => {
    renderCard({ events: [complete()] })
    toggle()
    expect(badgeTexts()).toEqual([])
  })
})

describe('PersonCard — editing the person', () => {
  it('opens the form with the current person, real name and partner fields included', () => {
    renderCard({ realName: 'Maria' }, { howWeMetTags: ['School'] })
    toggle()
    click(t.editPerson)
    expect(dialog()).not.toBeNull()
    expect(forms.person.initialValues).toMatchObject({ id: 'mia', realName: 'Maria' })
    expect(forms.person.includeRealName).toBe(true)
    expect(forms.person.includePartner).toBe(true)
    expect(forms.person.howWeMetTags).toEqual(['School'])
  })

  it('saves the changes for this person and closes', () => {
    renderCard()
    toggle()
    click(t.editPerson)
    act(() => forms.person.onSave({ name: 'Mia B' }))
    expect(handlers.onUpdatePerson).toHaveBeenCalledWith('mia', { name: 'Mia B' })
    expect(dialog()).toBeNull()
  })

  it('closes without saving on cancel', () => {
    renderCard()
    toggle()
    click(t.editPerson)
    act(() => forms.person.onCancel())
    expect(handlers.onUpdatePerson).not.toHaveBeenCalled()
    expect(dialog()).toBeNull()
  })

  it('closes when the dialog is dismissed', () => {
    renderCard()
    toggle()
    click(t.editPerson)
    act(() => openDialogs.current.at(-1)(false))
    expect(dialog()).toBeNull()
  })
})

describe('PersonCard — events', () => {
  it('opens an empty form to add an event, without a delete action', () => {
    renderCard({ events: [complete()] }, { placeTags: ['Park'], situationTags: ['Date'] })
    toggle()
    click(t.addEvent)
    expect(dialog().textContent).toContain(t.addEventTitle)
    expect(forms.event.initialValues).toBeNull()
    expect(forms.event.onDelete).toBeUndefined()
    expect(forms.event.placeTags).toEqual(['Park'])
    expect(forms.event.situationTags).toEqual(['Date'])
  })

  it('adds the event to this person and closes', () => {
    renderCard()
    toggle()
    click(t.addEvent)
    const values = { date: '2024.02.02', place: 'Bar', situation: 'Party' }
    act(() => forms.event.onSave(values))
    expect(handlers.onAddEvent).toHaveBeenCalledWith('mia', values)
    expect(handlers.onUpdateEvent).not.toHaveBeenCalled()
    expect(dialog()).toBeNull()
  })

  it('opens the tapped event for editing', () => {
    const event = complete({ id: 'e7' })
    renderCard({ events: [event] })
    toggle()
    act(() => eventRows()[0].click())
    expect(dialog().textContent).toContain(t.editEventTitle)
    expect(forms.event.initialValues).toBe(event)
  })

  it('updates the edited event and closes', () => {
    renderCard({ events: [complete({ id: 'e7' })] })
    toggle()
    act(() => eventRows()[0].click())
    act(() => forms.event.onSave({ place: 'Home' }))
    expect(handlers.onUpdateEvent).toHaveBeenCalledWith('mia', 'e7', { place: 'Home' })
    expect(handlers.onAddEvent).not.toHaveBeenCalled()
    expect(dialog()).toBeNull()
  })

  it('deletes the edited event and closes', () => {
    renderCard({ events: [complete({ id: 'e7' })] })
    toggle()
    act(() => eventRows()[0].click())
    act(() => forms.event.onDelete())
    expect(handlers.onDeleteEvent).toHaveBeenCalledWith('mia', 'e7')
    expect(dialog()).toBeNull()
  })

  it('goes back to add mode after an edit is cancelled', () => {
    renderCard({ events: [complete({ id: 'e7' })] })
    toggle()
    act(() => eventRows()[0].click())
    act(() => forms.event.onCancel())
    expect(dialog()).toBeNull()

    click(t.addEvent)
    expect(dialog().textContent).toContain(t.addEventTitle)
    expect(forms.event.initialValues).toBeNull()
  })

  it('closes when the dialog is dismissed', () => {
    renderCard()
    toggle()
    click(t.addEvent)
    act(() => openDialogs.current.at(-1)(false))
    expect(dialog()).toBeNull()
  })
})

describe('PersonCard — deleting', () => {
  it('deletes the person only from the confirmation action', () => {
    renderCard()
    toggle()
    click(t.deletePerson)
    expect(handlers.onDeletePerson).not.toHaveBeenCalled()
    click(t.deletePersonConfirmAction)
    expect(handlers.onDeletePerson).toHaveBeenCalledWith('mia')
  })

  it('deletes all events only from the confirmation action', () => {
    renderCard({ events: [complete()] })
    toggle()
    click(t.deleteAllEvents)
    expect(handlers.onDeleteAllEvents).not.toHaveBeenCalled()
    click(t.deleteAllEventsConfirmAction)
    expect(handlers.onDeleteAllEvents).toHaveBeenCalledWith('mia')
    expect(handlers.onDeletePerson).not.toHaveBeenCalled()
  })
})

describe('PersonCard — hardware back button', () => {
  it('closes the person form', () => {
    const modalBackRef = { current: null }
    renderCard({}, { modalBackRef })
    expect(modalBackRef.current).toBeNull()
    toggle()
    click(t.editPerson)
    expect(modalBackRef.current).toEqual(expect.any(Function))

    act(() => modalBackRef.current())
    expect(dialog()).toBeNull()
    expect(modalBackRef.current).toBeNull()
  })

  it('closes the event form', () => {
    const modalBackRef = { current: null }
    renderCard({}, { modalBackRef })
    toggle()
    click(t.addEvent)
    expect(modalBackRef.current).toEqual(expect.any(Function))

    act(() => modalBackRef.current())
    expect(dialog()).toBeNull()
    expect(modalBackRef.current).toBeNull()
  })

  it('releases the back button when the card disappears with a form open', () => {
    const modalBackRef = { current: null }
    renderCard({}, { modalBackRef })
    toggle()
    click(t.addEvent)
    act(() => root.render(null))
    expect(modalBackRef.current).toBeNull()
  })
})
