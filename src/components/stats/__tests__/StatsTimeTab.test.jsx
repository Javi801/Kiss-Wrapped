// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

const charts = vi.hoisted(() => ({}))

function capture(name) {
  return (props) => {
    charts[name] = props
    return null
  }
}

vi.mock('@/components/charts/BarChartCard', () => ({ default: capture('bar') }))
vi.mock('@/components/charts/DumbbellChartCard', () => ({ default: capture('dumbbell') }))
vi.mock('@/components/charts/EventsTimelineChartCard', () => ({
  default: capture('eventsTimeline'),
}))
vi.mock('@/components/charts/MultiYearTopCard', () => ({ default: capture('top') }))
vi.mock('@/components/charts/PersonsTimelineChartCard', () => ({
  default: capture('personsTimeline'),
}))
vi.mock('@/components/charts/HeatmapChartCard', () => ({ default: capture('heatmap') }))

import StatsTimeTab from '@/components/stats/StatsTimeTab'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

// One event per listed year; repeat a year for several events in it.
const person = (name, years) => ({
  id: name,
  name,
  events: years.map((year, index) => ({ id: `${name}-${index}`, date: `${year}.05.01` })),
})

let container
let root

function render(people, { deferred = true } = {}) {
  const allEvents = people.flatMap((item) =>
    item.events.map((event) => ({ ...event, person: item }))
  )
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<StatsTimeTab people={people} allEvents={allEvents} t={t} language="en" />)
  })
  if (deferred) act(() => vi.advanceTimersByTime(60))
  return allEvents
}

beforeEach(() => {
  vi.useFakeTimers()
  for (const key of Object.keys(charts)) delete charts[key]
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

describe('StatsTimeTab — deferred charts', () => {
  it('holds back the dumbbell and heatmap charts on the first paint', () => {
    render([person('Ana', [2020, 2021])], { deferred: false })
    expect(charts.top).toBeDefined()
    expect(charts.bar).toBeDefined()
    expect(charts.dumbbell).toBeUndefined()
    expect(charts.heatmap).toBeUndefined()
  })

  it('renders them shortly after', () => {
    render([person('Ana', [2020, 2021])])
    expect(charts.dumbbell).toBeDefined()
    expect(charts.heatmap).toBeDefined()
  })
})

describe('StatsTimeTab — multi-year top 3', () => {
  it('ranks by distinct years, then events, then earliest year, then name', () => {
    render([
      person('Ana', [2020, 2022]),
      person('Bob', [2021, 2022, 2023]),
      person('Cy', [2022]),
      person('Dee', [2019, 2019, 2020]),
      person('Eve', [2019, 2020]),
    ])
    expect(charts.top.top3.map((item) => item.label)).toEqual(['Bob', 'Dee', 'Eve'])
  })

  it('breaks a full tie alphabetically', () => {
    render([person('Zoe', [2020, 2021]), person('Ana', [2020, 2021])])
    expect(charts.top.top3.map((item) => item.label)).toEqual(['Ana', 'Zoe'])
  })

  it('never lists people seen in a single year', () => {
    render([person('Cy', [2022, 2022, 2022])])
    expect(charts.top.top3).toEqual([])
  })
})

describe('StatsTimeTab — year distribution', () => {
  it('counts how many people appear in exactly N years', () => {
    render([
      person('Ana', [2020, 2022]),
      person('Bob', [2021, 2022, 2023]),
      person('Eve', [2019, 2020]),
    ])
    expect(charts.bar.data).toEqual([
      { label: '2', value: 2 },
      { label: '3', value: 1 },
    ])
  })

  it('fills the gaps between 2 and the highest year count with zeros', () => {
    render([person('Ana', [2020, 2021]), person('Bob', [2018, 2019, 2020, 2021])])
    expect(charts.bar.data).toEqual([
      { label: '2', value: 1 },
      { label: '3', value: 0 },
      { label: '4', value: 1 },
    ])
  })

  it('starts at 2 even when nobody appears in exactly two years', () => {
    render([person('Bob', [2019, 2020, 2021])])
    expect(charts.bar.data).toEqual([
      { label: '2', value: 0 },
      { label: '3', value: 1 },
    ])
  })

  it('is empty without multi-year people', () => {
    render([person('Cy', [2022])])
    expect(charts.bar.data).toEqual([])
    expect(charts.bar.emptyText).toBe(t.noMultiYearPeopleYet)
  })
})

describe('StatsTimeTab — year axis of the multi-year charts', () => {
  it('spans the first to the last year without gaps', () => {
    render([person('Ana', [2018, 2021])])
    expect(charts.dumbbell.allYears).toEqual(['2018', '2019', '2020', '2021'])
    expect(charts.heatmap.allYears).toEqual(['2018', '2019', '2020', '2021'])
  })

  it('ignores years that only hold single-year people', () => {
    render([person('Ana', [2020, 2021]), person('Cy', [2015]), person('Dan', [2030])])
    expect(charts.dumbbell.allYears).toEqual(['2020', '2021'])
  })

  it('is empty without multi-year people', () => {
    render([person('Cy', [2022])])
    expect(charts.dumbbell.allYears).toEqual([])
    expect(charts.dumbbell.data).toEqual([])
    expect(charts.heatmap.data).toEqual([])
  })

  it('gives both charts only the multi-year people', () => {
    render([person('Ana', [2020, 2021]), person('Cy', [2022])])
    expect(charts.dumbbell.data.map((item) => item.label)).toEqual(['Ana'])
    expect(charts.heatmap.data).toBe(charts.dumbbell.data)
  })
})

describe('StatsTimeTab — timelines', () => {
  it('passes events to the events timeline and people to the persons timeline', () => {
    const people = [person('Ana', [2020, 2021])]
    const allEvents = render(people)
    expect(charts.eventsTimeline.allEvents).toBe(allEvents)
    expect(charts.eventsTimeline.language).toBe('en')
    expect(charts.personsTimeline.people).toBe(people)
    expect(charts.personsTimeline.language).toBe('en')
  })
})
