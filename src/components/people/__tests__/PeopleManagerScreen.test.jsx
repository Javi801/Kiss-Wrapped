// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY, ZODIAC_OPTIONS } from '@/lib/constants'
import { formatDisplayDate } from '@/lib/date'

const seen = vi.hoisted(() => ({ filters: null, sheet: null, cards: {} }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/person/PersonCard', async () => {
  const { createElement } = await import('react')
  return {
    default: (props) => {
      seen.cards[props.person.id] = props
      return createElement('div', { 'data-person': props.person.id })
    },
  }
})
vi.mock('@/components/forms/FiltersPanel', () => ({
  default: (props) => {
    seen.filters = props
    return null
  },
}))
vi.mock('@/components/ui/sheet', () => {
  const passthrough = ({ children }) => children
  return {
    Sheet: (props) => {
      seen.sheet = props
      return props.children
    },
    SheetTrigger: passthrough,
    SheetContent: passthrough,
    SheetHeader: passthrough,
    SheetTitle: passthrough,
  }
})

import PeopleManagerScreen from '@/components/people/PeopleManagerScreen'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

// `age` is the legacy static field, so ages don't depend on today's date.
const person = (name, extra = {}) => ({
  id: name.toLowerCase(),
  name,
  age: 30,
  activity: 'works',
  zodiacSign: ZODIAC_OPTIONS.en[0],
  events: [],
  ...extra,
})
const event = (date, details = '') => ({ id: date, date, details })

let container
let root
let modalBackRef

function render(people, props = {}) {
  modalBackRef = { current: null }
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <PeopleManagerScreen
        people={people}
        t={t}
        language="en"
        modalBackRef={modalBackRef}
        {...props}
      />
    )
  })
}

const shown = () =>
  [...container.querySelectorAll('[data-person]')].map((node) => node.dataset.person)
const groups = () =>
  [...container.querySelectorAll('[id^="group-"]')].map((node) => node.textContent)
const letter = (value) => container.querySelector(`[data-letter="${value}"]`)
const setFilters = (patch) => act(() => seen.filters.setFilters((prev) => ({ ...prev, ...patch })))

function search(text) {
  const input = container.querySelector('input')
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  act(() => {
    setValue.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  seen.filters = null
  seen.sheet = null
  seen.cards = {}
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
  delete Element.prototype.scrollIntoView
  delete document.elementFromPoint
})

describe('PeopleManagerScreen — list', () => {
  it('lists everyone by name, grouped by initial', () => {
    render([person('Bob'), person('ana'), person('Abel')])
    expect(shown()).toEqual(['abel', 'ana', 'bob'])
    expect(groups()).toEqual(['A', 'B'])
  })

  it('groups names that do not start with a letter under #', () => {
    render([person('Ana'), person('7up'), person('Ñandú')])
    expect(groups()).toEqual(['#', 'A'])
    expect(shown()).toEqual(['7up', 'ñandú', 'ana'])
  })

  it('shows the empty state when there is nobody', () => {
    render([])
    expect(container.textContent).toContain(t.noPeopleYet)
    expect(container.textContent).toContain(t.noPeopleYetDesc)
    expect(shown()).toEqual([])
  })

  it('offers no search reset when there is nobody', () => {
    render([])
    expect(container.textContent).not.toContain(t.noPeopleFound)
    expect(container.textContent).not.toContain(t.tryDifferent)
    expect(container.textContent).not.toContain(t.clearSearch)
  })

  it('wires every card to the screen handlers and tags', () => {
    const props = {
      onUpdatePerson: vi.fn(),
      onDeletePerson: vi.fn(),
      onAddEvent: vi.fn(),
      onUpdateEvent: vi.fn(),
      onDeleteEvent: vi.fn(),
      onDeleteAllEvents: vi.fn(),
      onAddSituationTag: vi.fn(),
      onAddPlaceTag: vi.fn(),
      onAddHowWeMetTag: vi.fn(),
      situationTags: ['Date'],
      placeTags: ['Park'],
      howWeMetTags: ['School'],
    }
    render([person('Ana')], props)
    expect(seen.cards.ana).toMatchObject({ ...props, language: 'en', t, modalBackRef })
  })
})

describe('PeopleManagerScreen — search', () => {
  const people = [
    person('Ana', { realName: 'Mariana Soto' }),
    person('Bob', { howWeMet: 'Chess club' }),
    person('Cy', { detail: 'plays guitar' }),
    person('Dee', { events: [event('2024.01.01', 'Concert night')] }),
  ]

  it.each([
    ['name', 'an', ['ana']],
    ['real name', 'soto', ['ana']],
    ['how we met', 'CHESS', ['bob']],
    ['note', 'guitar', ['cy']],
    ['event details', 'concert', ['dee']],
  ])('matches by %s, ignoring case', (_field, query, expected) => {
    render(people)
    search(query)
    expect(shown()).toEqual(expected)
  })

  it('ignores surrounding spaces', () => {
    render(people)
    search('  bob  ')
    expect(shown()).toEqual(['bob'])
  })

  it('shows the empty state when nothing matches', () => {
    render(people)
    search('zzz')
    expect(shown()).toEqual([])
    expect(container.textContent).toContain(t.noPeopleFound)
  })

  it('clears the search and the filters from the empty state', () => {
    render(people)
    setFilters({ minAge: '99', activity: ['studies'] })
    search('zzz')
    act(() => {
      ;[...container.querySelectorAll('button')]
        .find((item) => item.textContent === t.clearSearch)
        .click()
    })
    expect(shown()).toEqual(['ana', 'bob', 'cy', 'dee'])
    expect(container.querySelector('input').value).toBe('')
    expect(seen.filters.filters).toEqual({
      minAge: '',
      maxAge: '',
      activity: [],
      zodiacSign: [],
      eventDateFrom: '',
      eventDateTo: '',
    })
  })
})

describe('PeopleManagerScreen — filters', () => {
  const people = [
    person('Ana', { age: 20, activity: 'studies', events: [event('2023.05.10')] }),
    person('Bob', { age: 30, activity: 'works', events: [event('2024.02.01')] }),
    person('Cy', {
      age: 40,
      activity: 'other',
      zodiacSign: ZODIAC_OPTIONS.es[1],
      events: [event('2022.01.01'), event('2024.06.15')],
    }),
    person('Dee', { age: 30, events: [] }),
  ]

  it('starts with no filters and reports the result count', () => {
    render(people)
    expect(seen.filters.peopleCount).toBe(4)
    expect(seen.filters.groupBy).toBe('name')
    expect(seen.filters.sortBy).toBe('name')
    expect(seen.filters.language).toBe('en')
  })

  it('keeps people at or above the minimum age', () => {
    render(people)
    setFilters({ minAge: '30' })
    expect(shown()).toEqual(['bob', 'cy', 'dee'])
    expect(seen.filters.peopleCount).toBe(3)
  })

  it('keeps people at or below the maximum age', () => {
    render(people)
    setFilters({ maxAge: '30' })
    expect(shown()).toEqual(['ana', 'bob', 'dee'])
  })

  it('combines both age bounds', () => {
    render(people)
    setFilters({ minAge: '25', maxAge: '35' })
    expect(shown()).toEqual(['bob', 'dee'])
  })

  it('keeps people with any of the selected activities', () => {
    render(people)
    setFilters({ activity: ['studies', 'other'] })
    expect(shown()).toEqual(['ana', 'cy'])
  })

  it('matches a zodiac sign stored in the other language', () => {
    render(people)
    setFilters({ zodiacSign: [ZODIAC_OPTIONS.en[1]] })
    expect(shown()).toEqual(['cy'])
  })

  it('keeps people with an event on or after the start date', () => {
    render(people)
    setFilters({ eventDateFrom: '2024.02.01' })
    expect(shown()).toEqual(['bob', 'cy'])
  })

  it('keeps people with an event on or before the end date', () => {
    render(people)
    setFilters({ eventDateTo: '2023.05.10' })
    expect(shown()).toEqual(['ana', 'cy'])
  })

  it('requires a single event inside the whole date range', () => {
    render(people)
    setFilters({ eventDateFrom: '2023.01.01', eventDateTo: '2023.12.31' })
    expect(shown()).toEqual(['ana'])
  })

  it('leaves out undated events when filtering by date', () => {
    render([person('Eve', { events: [{ id: 'x', date: '' }] })])
    setFilters({ eventDateFrom: '2000.01.01' })
    expect(shown()).toEqual([])
  })

  it('applies the search and the filters together', () => {
    render(people)
    setFilters({ minAge: '30' })
    search('b')
    expect(shown()).toEqual(['bob'])
  })
})

describe('PeopleManagerScreen — sorting and grouping', () => {
  const people = [
    person('Ana', { events: [event('2023.05.10'), event('2024.03.01')] }),
    person('Bob', { events: [event('2022.01.01')] }),
    person('Cy', { events: [] }),
  ]

  it('orders people inside a group by the chosen sort', () => {
    const sameInitial = [
      person('Ana', { events: [event('2024.03.01')] }),
      person('Abel', { events: [event('2022.01.01')] }),
      person('Alba', { events: [] }),
    ]
    render(sameInitial)
    act(() => seen.filters.setSortBy('firstEventDate'))
    expect(shown()).toEqual(['abel', 'ana', 'alba'])
    act(() => seen.filters.setSortBy('lastEventDate'))
    expect(shown()).toEqual(['ana', 'abel', 'alba'])
  })

  it('groups by last event date, with a group for people without events', () => {
    render(people)
    act(() => seen.filters.setGroupBy('lastEventDate'))
    expect(groups()).toEqual([
      formatDisplayDate('2022.01.01'),
      formatDisplayDate('2024.03.01'),
      t.noEvents,
    ])
    expect(shown()).toEqual(['bob', 'ana', 'cy'])
  })

  it('puts people with the same last event date in one group', () => {
    render([
      person('Ana', { events: [event('2024.03.01')] }),
      person('Bob', { events: [event('2024.03.01')] }),
    ])
    act(() => seen.filters.setGroupBy('lastEventDate'))
    expect(groups()).toHaveLength(1)
    expect(shown()).toEqual(['ana', 'bob'])
  })
})

describe('PeopleManagerScreen — alphabet index', () => {
  const people = [person('Ana'), person('Bob'), person('Zoe')]

  it('offers # and the 26 letters', () => {
    render(people)
    expect(container.querySelectorAll('[data-letter]')).toHaveLength(27)
  })

  it('is hidden when grouping by date', () => {
    render(people)
    act(() => seen.filters.setGroupBy('lastEventDate'))
    expect(container.querySelectorAll('[data-letter]')).toHaveLength(0)
  })

  it('is hidden when the list is empty', () => {
    render([])
    expect(container.querySelectorAll('[data-letter]')).toHaveLength(0)
  })

  it('scrolls to the group of a tapped letter', () => {
    render(people)
    act(() => letter('Z').click())
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledOnce()
    expect(Element.prototype.scrollIntoView.mock.contexts[0].id).toBe('group-Z')
  })

  it('marks the tapped letter for a moment', () => {
    render(people)
    const indicator = () => letter('A').parentElement.firstElementChild.style.top
    const resting = indicator()
    act(() => letter('Z').click())
    expect(indicator()).toBe('100%')
    act(() => vi.advanceTimersByTime(900))
    expect(indicator()).toBe(resting)
  })

  it('keeps the mark while dragging and fades it after the finger lifts', () => {
    render(people)
    const strip = letter('A').parentElement
    const indicator = () => strip.firstElementChild.style.top
    const resting = indicator()
    document.elementFromPoint = vi.fn(() => letter('Z'))
    const move = new Event('touchmove', { bubbles: true, cancelable: true })
    move.touches = [{ clientX: 5, clientY: 40 }]
    act(() => {
      strip.dispatchEvent(move)
    })
    act(() => vi.advanceTimersByTime(5000))
    expect(indicator()).toBe('100%')

    act(() => {
      strip.dispatchEvent(new Event('touchend', { bubbles: true }))
    })
    act(() => vi.advanceTimersByTime(900))
    expect(indicator()).toBe(resting)
  })

  it('ignores letters without people', () => {
    render(people)
    act(() => letter('M').click())
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it('scrolls while dragging over the letters', () => {
    render(people)
    document.elementFromPoint = vi.fn(() => letter('B'))
    const move = new Event('touchmove', { bubbles: true, cancelable: true })
    move.touches = [{ clientX: 5, clientY: 40 }]
    act(() => {
      letter('A').parentElement.dispatchEvent(move)
    })
    expect(document.elementFromPoint).toHaveBeenCalledWith(5, 40)
    expect(Element.prototype.scrollIntoView.mock.contexts[0].id).toBe('group-B')
  })

  it.each([
    ['a letter without people', () => letter('M')],
    ['something that is not a letter', () => container],
    ['nothing', () => null],
  ])('does not scroll while dragging over %s', (_case, target) => {
    render(people)
    document.elementFromPoint = vi.fn(target)
    const move = new Event('touchmove', { bubbles: true, cancelable: true })
    move.touches = [{ clientX: 5, clientY: 40 }]
    act(() => {
      letter('A').parentElement.dispatchEvent(move)
    })
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it('ignores a drag without touch points', () => {
    render(people)
    document.elementFromPoint = vi.fn()
    const move = new Event('touchmove', { bubbles: true, cancelable: true })
    move.touches = []
    act(() => {
      letter('A').parentElement.dispatchEvent(move)
    })
    expect(document.elementFromPoint).not.toHaveBeenCalled()
  })
})

describe('PeopleManagerScreen — filter sheet', () => {
  it('starts closed', () => {
    render([person('Ana')])
    expect(seen.sheet.open).toBe(false)
    expect(modalBackRef.current).toBeNull()
  })

  it('lets the hardware back button close the open sheet', () => {
    render([person('Ana')])
    act(() => seen.sheet.onOpenChange(true))
    expect(seen.sheet.open).toBe(true)
    expect(modalBackRef.current).toEqual(expect.any(Function))

    act(() => modalBackRef.current())
    expect(seen.sheet.open).toBe(false)
  })

  it('opens and closes the sheet without a back button to register on', () => {
    render([person('Ana')], { modalBackRef: undefined })
    expect(() => act(() => seen.sheet.onOpenChange(true))).not.toThrow()
    expect(seen.sheet.open).toBe(true)
    expect(() => act(() => seen.sheet.onOpenChange(false))).not.toThrow()
    expect(seen.sheet.open).toBe(false)
  })

  it('releases the back button when the sheet is closed', () => {
    render([person('Ana')])
    act(() => seen.sheet.onOpenChange(true))
    act(() => seen.sheet.onOpenChange(false))
    expect(seen.sheet.open).toBe(false)
    expect(modalBackRef.current).toBeNull()
  })
})

describe('PeopleManagerScreen — onboarding tour', () => {
  it('passes no tour to the cards by default', () => {
    render([person('Ana')])
    expect(Object.values(seen.cards)[0].tour).toBeUndefined()
  })

  it('passes the card tour to the cards', () => {
    const cardTour = { expanded: true }
    render([person('Ana')], { cardTour })
    expect(Object.values(seen.cards)[0].tour).toBe(cardTour)
  })
})
