// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY, ZODIAC_OPTIONS } from '@/lib/constants'

// Selects and date pickers in render order.
const fields = vi.hoisted(() => ({ selects: [], dates: [] }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/ui/select', async () => {
  const { createElement } = await import('react')
  return {
    Select: (props) => {
      fields.selects.push(props)
      return createElement('ul', null, props.children)
    },
    SelectTrigger: () => null,
    SelectValue: () => null,
    SelectContent: ({ children }) => children,
    SelectItem: ({ value, children }) => createElement('li', { 'data-value': value }, children),
  }
})
vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: (props) => {
    fields.dates.push(props)
    return null
  },
}))

import FiltersPanel from '@/components/forms/FiltersPanel'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

const EMPTY = {
  minAge: '',
  maxAge: '',
  activity: [],
  howWeMet: [],
  zodiacSign: [],
  eventDateFrom: '',
  eventDateTo: '',
}

let container
let root
let current

const report = (filters) => {
  current = filters
}

// Owns the filter state, like the people screen does.
function Harness({ initial, setGroupBy, setSortBy, ...props }) {
  const [filters, setFilters] = useState(initial)
  report(filters)
  return (
    <FiltersPanel
      filters={filters}
      setFilters={setFilters}
      groupBy="lastEventDate"
      setGroupBy={setGroupBy}
      sortBy="firstEventDate"
      setSortBy={setSortBy}
      peopleCount={3}
      t={t}
      language="en"
      {...props}
    />
  )
}

function render({ filters = {}, howWeMetTags = ['School', 'Work'], ...props } = {}) {
  const handlers = { setGroupBy: vi.fn(), setSortBy: vi.fn() }
  fields.selects = []
  fields.dates = []
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <Harness initial={{ ...EMPTY, ...filters }} howWeMetTags={howWeMetTags} {...handlers} {...props} />
    )
  })
  return handlers
}

const buttons = () => [...container.querySelectorAll('button')]
const click = (label) =>
  act(() => {
    buttons()
      .find((item) => item.textContent.includes(label))
      .dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

function typeInto(input, text) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  act(() => {
    setValue.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

// Latest props of the n-th select / date picker.
const select = (index) => fields.selects.filter((_, i) => i % 2 === index).at(-1)
const datePicker = (index) => fields.dates.filter((_, i) => i % 2 === index).at(-1)
const optionValues = (index) =>
  [...container.querySelectorAll('ul')[index].querySelectorAll('li')].map(
    (item) => item.dataset.value
  )

beforeEach(() => {
  current = undefined
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('FiltersPanel — results count', () => {
  it('uses the plural for several results', () => {
    render({ peopleCount: 3 })
    expect(container.textContent).toContain(`${t.showingResults} 3 ${t.results}`)
  })

  it('uses the singular for one result', () => {
    render({ peopleCount: 1 })
    expect(container.textContent).toContain(`${t.showingResults} 1 ${t.result}`)
  })

  it('uses the plural for no results', () => {
    render({ peopleCount: 0 })
    expect(container.textContent).toContain(`${t.showingResults} 0 ${t.results}`)
  })
})

describe('FiltersPanel — activity', () => {
  it('filters by the language-neutral activity key', () => {
    render()
    click(t.works)
    expect(current.activity).toEqual(['works'])
  })

  it('combines several activities', () => {
    render()
    click(t.studiesWorks)
    click(t.other)
    expect(current.activity).toEqual(['studies and works', 'other'])
  })

  it('removes an activity that is tapped again', () => {
    render({ filters: { activity: ['works', 'other'] } })
    click(t.works)
    expect(current.activity).toEqual(['other'])
  })

  it('leaves the other filters untouched', () => {
    render({ filters: { minAge: '20', zodiacSign: [ZODIAC_OPTIONS.en[0]] } })
    click(t.other)
    expect(current).toMatchObject({ minAge: '20', zodiacSign: [ZODIAC_OPTIONS.en[0]] })
  })
})

describe('FiltersPanel — how we met', () => {
  it('filters by a stored how-we-met tag', () => {
    render({ filters: { howWeMet: ['School'] }, language: 'en' })
    click('School')
    expect(current.howWeMet).toEqual([])
  })

  it('keeps the selected how-we-met tags in the filter state', () => {
    render({ filters: { howWeMet: ['School'] }, language: 'en' })
    click('Work')
    expect(current.howWeMet).toEqual(['School', 'Work'])
  })
})

describe('FiltersPanel — zodiac', () => {
  const zodiacChips = () => buttons().filter((item) => /\(.*\)$/.test(item.textContent))

  it.each(['en', 'es'])('offers the twelve signs with numeric date ranges (%s)', (language) => {
    render({ language })
    const labels = zodiacChips().map((chip) => chip.textContent)
    expect(labels).toHaveLength(12)
    for (const label of labels) {
      expect(label).toMatch(/^\S+ \S+ \(\d{2}\/\d{2} - \d{2}\/\d{2}\)$/)
    }
  })

  it('shows the same date ranges in both languages', () => {
    const ranges = (language) => {
      render({ language })
      const found = zodiacChips().map((chip) => chip.textContent.match(/\(.*\)$/)[0])
      act(() => root.unmount())
      container.remove()
      return found
    }
    const english = ranges('en')
    const spanish = ranges('es')
    render()
    expect(spanish).toEqual(english)
  })

  it('shows Aquarius as 20/01 - 19/02', () => {
    render()
    expect(zodiacChips()[0].textContent).toBe('♒ Aquarius (20/01 - 19/02)')
  })

  it('filters by the stored zodiac option, not by its short label', () => {
    render()
    click('Aquarius')
    expect(current.zodiacSign).toEqual([ZODIAC_OPTIONS.en[0]])
  })

  it('removes a sign that is tapped again', () => {
    render({ filters: { zodiacSign: [ZODIAC_OPTIONS.en[0], ZODIAC_OPTIONS.en[1]] } })
    click('Aquarius')
    expect(current.zodiacSign).toEqual([ZODIAC_OPTIONS.en[1]])
  })
})

describe('FiltersPanel — age and dates', () => {
  it('updates the minimum and maximum age', () => {
    render()
    const [minAge, maxAge] = container.querySelectorAll('input')
    typeInto(minAge, '21')
    typeInto(maxAge, '35')
    expect(current).toMatchObject({ minAge: '21', maxAge: '35' })
  })

  it('shows the current age bounds', () => {
    render({ filters: { minAge: '18', maxAge: '40' } })
    const [minAge, maxAge] = container.querySelectorAll('input')
    expect(minAge.value).toBe('18')
    expect(maxAge.value).toBe('40')
  })

  it('updates the event date range', () => {
    render()
    act(() => datePicker(0).onChange('2024.01.01'))
    act(() => datePicker(1).onChange('2024.12.31'))
    expect(current).toMatchObject({ eventDateFrom: '2024.01.01', eventDateTo: '2024.12.31' })
    expect(datePicker(0).value).toBe('2024.01.01')
    expect(datePicker(1).value).toBe('2024.12.31')
  })
})

describe('FiltersPanel — grouping and sorting', () => {
  it('binds the group selector', () => {
    const { setGroupBy } = render()
    expect(select(0).value).toBe('lastEventDate')
    expect(optionValues(0)).toEqual(['name', 'lastEventDate'])
    select(0).onValueChange('name')
    expect(setGroupBy).toHaveBeenCalledWith('name')
  })

  it('binds the sort selector', () => {
    const { setSortBy } = render()
    expect(select(1).value).toBe('firstEventDate')
    expect(optionValues(1)).toEqual(['name', 'firstEventDate', 'lastEventDate'])
    select(1).onValueChange('lastEventDate')
    expect(setSortBy).toHaveBeenCalledWith('lastEventDate')
  })
})

describe('FiltersPanel — reset', () => {
  it('clears every filter and restores grouping and sorting by name', () => {
    const { setGroupBy, setSortBy } = render({
      filters: {
        minAge: '20',
        maxAge: '30',
        activity: ['works'],
        zodiacSign: [ZODIAC_OPTIONS.en[3]],
        eventDateFrom: '2024.01.01',
        eventDateTo: '2024.12.31',
      },
    })
    click(t.resetFilters)
    expect(current).toEqual(EMPTY)
    expect(setGroupBy).toHaveBeenCalledWith('name')
    expect(setSortBy).toHaveBeenCalledWith('name')
  })
})
