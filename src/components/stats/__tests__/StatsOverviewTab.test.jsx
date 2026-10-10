import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { COPY } from '@/lib/constants'
import { LIMITS } from '@/lib/config'

const seen = vi.hoisted(() => ({ tiles: [], top: null, bar: null }))

vi.mock('@/components/shared/StatTile', () => ({
  default: (props) => {
    seen.tiles.push(props)
    return null
  },
}))
vi.mock('@/components/shared/TopPersonTile', () => ({
  default: (props) => {
    seen.top = props
    return null
  },
}))
vi.mock('@/components/charts/BarChartCard', () => ({
  default: (props) => {
    seen.bar = props
    return null
  },
}))

import StatsOverviewTab from '@/components/stats/StatsOverviewTab'

const t = COPY.en

const person = (name, scores) => ({
  id: name,
  name,
  events: scores.map((score, index) => ({ id: `${name}-${index}`, date: '2024.01.01', score })),
})

function render(people) {
  const allEvents = people.flatMap((item) =>
    item.events.map((event) => ({ ...event, person: item }))
  )
  renderToStaticMarkup(<StatsOverviewTab people={people} allEvents={allEvents} t={t} />)
}

const tile = (label) => seen.tiles.find((item) => item.label === label)

describe('StatsOverviewTab', () => {
  beforeEach(() => {
    seen.tiles = []
    seen.top = null
    seen.bar = null
  })

  it('shows the average events per person', () => {
    render([person('Ana', [1, 2, 3]), person('Bob', [])])
    expect(tile(t.avgEvents).value).toBe('1.5')
  })

  it('averages only the scored events', () => {
    render([person('Ana', [2, 5, null])])
    expect(tile(t.averageScore).value).toBe('3.5')
  })

  it('shows the total number of events', () => {
    render([person('Ana', [1, null]), person('Bob', [3])])
    expect(tile(t.totalEvents).value).toBe(3)
  })

  it('shows zeros when there is no data', () => {
    render([])
    expect(tile(t.avgEvents).value).toBe('0.0')
    expect(tile(t.averageScore).value).toBe('0.0')
    expect(tile(t.totalEvents).value).toBe(0)
    expect(seen.top.topPeople).toEqual([])
    expect(seen.bar.data).toEqual([])
  })

  it('uses the singular label for a single top person', () => {
    render([person('Ana', [1, 2]), person('Bob', [1])])
    expect(seen.top.label).toBe(t.topPerson)
    expect(seen.top.topPeople).toEqual([{ label: 'Ana', value: 2 }])
  })

  it('uses the plural label when several people tie for the top', () => {
    render([person('Ana', [1, 2]), person('Bob', [1, 3]), person('Cy', [4])])
    expect(seen.top.label).toBe(t.topPersonPlural)
    expect(seen.top.topPeople.map((item) => item.label).sort()).toEqual(['Ana', 'Bob'])
  })

  it('ranks people by events in a horizontal chart, most events first', () => {
    render([person('Ana', [1]), person('Bob', [1, 2, 3]), person('Cy', [1, 2])])
    expect(seen.bar.horizontal).toBe(true)
    expect(seen.bar.data.map((row) => row.label)).toEqual(['Bob', 'Cy', 'Ana'])
  })

  it('caps the ranking at the configured number of people', () => {
    const people = Array.from({ length: LIMITS.topPeopleCount + 3 }, (_, index) =>
      person(`P${index}`, Array(index + 1).fill(null))
    )
    render(people)
    expect(seen.bar.data).toHaveLength(LIMITS.topPeopleCount)
    expect(seen.bar.data[0].value).toBe(LIMITS.topPeopleCount + 3)
  })
})
