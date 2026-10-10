// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY, ZODIAC_OPTIONS } from '@/lib/constants'

const box = vi.hoisted(() => ({ props: null }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/charts/FullscreenChartWrapper', () => ({
  default: ({ children }) => children,
}))
vi.mock('@/components/stats/AgeRangeBox', async () => {
  const { createElement } = await import('react')
  return {
    default: (props) => {
      box.props = props
      return createElement('div', { 'data-box': true })
    },
  }
})

import AgeRangeCard from '@/components/stats/AgeRangeCard'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

// Without a zodiac sign the age at an event is simply event year - birth year.
const person = (id, birthYear, dates, extra = {}) => ({
  id,
  name: id,
  birthYear,
  zodiacSign: null,
  events: dates.map((date, index) => ({ id: `${id}-${index}`, date })),
  ...extra,
})

let container
let root

function render(people) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<AgeRangeCard title="Age range" people={people} emptyText="No ages yet" t={t} />)
  })
}

const press = (label) =>
  act(() => {
    ;[...container.querySelectorAll('button')].find((item) => item.textContent === label).click()
  })
const splitByYear = () => press(t.divideByYear)
const percent = (node, property) => parseFloat(node.style[property])
const ticks = () => [...container.querySelectorAll('span')].map((node) => Number(node.textContent))

// Boxplot rows keyed by year; children are: axis line, min, max, box, median.
function rows() {
  const labels = [...container.querySelectorAll('div')].filter(
    (node) => node.children.length === 0 && /^\d{4}$/.test(node.textContent)
  )
  return labels.map((label) => {
    const [, min, max, boxNode, median] = label.nextElementSibling.children
    return {
      year: label.textContent,
      min: percent(min, 'left'),
      max: percent(max, 'left'),
      boxLeft: percent(boxNode, 'left'),
      boxWidth: percent(boxNode, 'width'),
      median: percent(median, 'left'),
    }
  })
}

beforeEach(() => {
  box.props = null
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('AgeRangeCard — all years together', () => {
  it('starts with everyone in a single boxplot', () => {
    render([person('ana', 2000, ['2020.05.01'])])
    expect(container.textContent).toContain(t.allYears)
    expect(container.querySelector('[data-box]')).not.toBeNull()
    expect(box.props).toMatchObject({ bare: true, emptyText: 'No ages yet' })
  })

  it('counts each person once, however many years they appear in', () => {
    render([
      person('ana', 2000, ['2020.05.01', '2021.05.01', '2022.05.01']),
      person('bob', 1990, ['2021.05.01']),
    ])
    expect(box.props.people.map((item) => item.id).sort()).toEqual(['ana', 'bob'])
  })

  it('leaves out people without dated events', () => {
    render([
      person('ana', 2000, ['2020.05.01']),
      person('bob', 1990, []),
      person('cy', 1995, ['']),
      { id: 'dee', name: 'dee', birthYear: 1990 },
    ])
    expect(box.props.people.map((item) => item.id)).toEqual(['ana'])
  })
})

describe('AgeRangeCard — divided by year', () => {
  it('switches the description and back', () => {
    render([person('ana', 2000, ['2020.05.01'])])
    splitByYear()
    expect(container.textContent).toContain(t.agesAsOfYear)
    expect(container.querySelector('[data-box]')).toBeNull()
    press(t.showAllTogether)
    expect(container.querySelector('[data-box]')).not.toBeNull()
  })

  it('draws one row per year, oldest first', () => {
    render([person('ana', 2000, ['2022.05.01', '2020.05.01']), person('bob', 1990, ['2021.05.01'])])
    splitByYear()
    expect(rows().map((row) => row.year)).toEqual(['2020', '2021', '2022'])
  })

  it('uses the age each person had that year, on an axis shared by all years', () => {
    render([person('ana', 2000, ['2020.05.01', '2022.05.01']), person('bob', 1990, ['2020.05.01'])])
    splitByYear()
    expect(ticks()).toEqual([20, 25, 30])

    const [y2020, y2022] = rows()
    expect(y2020).toEqual({
      year: '2020',
      min: 3,
      max: 97,
      boxLeft: 26.5,
      boxWidth: 47,
      median: 50,
    })
    // Ana alone, aged 22: a fifth of the way along the 20–30 axis.
    expect(y2022.min).toBeCloseTo(21.8)
    expect(y2022.max).toBeCloseTo(21.8)
    expect(y2022.median).toBeCloseTo(21.8)
    expect(y2022.boxWidth).toBe(0.5)
  })

  it('counts a person once per year, however many events they have', () => {
    render([
      person('ana', 2000, ['2020.01.01', '2020.06.01', '2020.12.01']),
      person('bob', 1990, ['2020.05.01']),
    ])
    splitByYear()
    expect(rows()[0].median).toBe(50)
  })

  it('takes the age with most events when a birthday falls inside the year', () => {
    // Aquarius ends on February 19: before it the person is still a year younger.
    const aquarius = { zodiacSign: ZODIAC_OPTIONS.en[0] }
    render([
      person('ana', 2000, ['2020.01.05', '2020.01.20', '2020.06.01'], aquarius),
      person('ref', 1990, ['2020.06.01']),
      person('low', 2001, ['2020.06.01']),
    ])
    splitByYear()
    // Ages 19 (low), 19 (ana), 30 (ref): the median sits on 19.
    expect(rows()[0].median).toBe(rows()[0].min)
  })

  it('takes the higher age when both have the same number of events', () => {
    const aquarius = { zodiacSign: ZODIAC_OPTIONS.en[0] }
    render([
      person('ana', 2000, ['2020.01.05', '2020.06.01'], aquarius),
      person('ref', 1990, ['2020.06.01']),
      person('low', 2001, ['2020.06.01']),
    ])
    splitByYear()
    // Ages 19 (low), 20 (ana), 30 (ref): the median moves off the minimum.
    expect(rows()[0].median).toBeGreaterThan(rows()[0].min)
  })

  it('falls back to the stored age for people without a birth year', () => {
    render([
      person('ana', undefined, ['2020.05.01'], { age: 20 }),
      person('bob', undefined, ['2020.05.01'], { age: 30 }),
    ])
    splitByYear()
    expect(ticks()).toEqual([20, 25, 30])
    expect(rows()[0]).toMatchObject({ min: 3, max: 97 })
  })

  it('skips people whose age is unknown', () => {
    render([person('ana', 2000, ['2020.05.01']), person('bob', undefined, ['2021.05.01'])])
    splitByYear()
    expect(rows().map((row) => row.year)).toEqual(['2020'])
  })

  it('still draws an axis when everyone has the same age', () => {
    render([person('ana', 1995, ['2020.05.01'])])
    splitByYear()
    expect(ticks()).toEqual([25, 26])
    expect(rows()[0].min).toBe(3)
  })

  it.each([
    [
      [18, 22],
      [18, 19, 20, 21, 22],
    ],
    [
      [18, 26],
      [18, 20, 22, 24, 26],
    ],
    [
      [21, 39],
      [20, 25, 30, 35, 40],
    ],
    [
      [18, 58],
      [10, 20, 30, 40, 50, 60],
    ],
    [
      [18, 78],
      [15, 30, 45, 60, 75, 90],
    ],
  ])('rounds the axis for ages %j to the ticks %j', ([youngest, oldest], expected) => {
    render([
      person('young', 2020 - youngest, ['2020.05.01']),
      person('old', 2020 - oldest, ['2020.05.01']),
    ])
    splitByYear()
    expect(ticks()).toEqual(expected)
    const [row] = rows()
    expect(row.min).toBeGreaterThanOrEqual(3)
    expect(row.max).toBeLessThanOrEqual(97)
  })

  it('shows the empty text when nobody has a usable age', () => {
    render([person('bob', undefined, ['2021.05.01'])])
    splitByYear()
    expect(container.textContent).toContain('No ages yet')
    expect(rows()).toEqual([])
  })

  it('shows the empty text when there are no events', () => {
    render([])
    splitByYear()
    expect(container.textContent).toContain('No ages yet')
  })
})
