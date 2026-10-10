// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

// What the mocked chart received, and the hover state fed to its tooltip.
const chart = vi.hoisted(() => ({ data: null, tick: null, domain: null, hover: null }))
const popup = vi.hoisted(() => ({ props: null }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/charts/FullscreenChartWrapper', () => ({
  default: ({ children }) => children,
}))
vi.mock('@/components/charts/timeline/TimelineCalendarPopup', () => ({
  default: (props) => {
    popup.props = props
    return null
  },
}))
vi.mock('recharts', async () => {
  const { createElement, cloneElement } = await import('react')
  return {
    ResponsiveContainer: ({ children }) => children,
    BarChart: ({ data, children }) => {
      chart.data = data
      return createElement('div', { 'data-chart': true }, children)
    },
    XAxis: ({ tickFormatter }) => {
      chart.tick = tickFormatter
      return null
    },
    YAxis: ({ domain }) => {
      chart.domain = domain
      return null
    },
    Tooltip: ({ content }) => (chart.hover ? cloneElement(content, chart.hover) : null),
    Bar: () => null,
    CartesianGrid: () => null,
  }
})

import PersonsTimelineChartCard from '@/components/charts/timeline/PersonsTimelineChartCard'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en
// Wednesday 12 June 2024; its week runs from Monday 10 to Sunday 16 June.
const NOW = new Date(2024, 5, 12, 12, 0, 0)
const person = (id, ...dates) => ({
  id,
  name: id,
  events: dates.map((date, index) => ({ id: `${id}-${index}`, date })),
})

let container
let root

function render(people, language = 'en') {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<PersonsTimelineChartCard people={people} t={COPY[language]} language={language} />)
  })
}

const buttons = () => [...container.querySelectorAll('button')]
const show = (label) =>
  act(() =>
    buttons()
      .find((item) => item.textContent === label)
      .click()
  )
// The arrows are the only buttons without text.
const arrows = () => buttons().filter((item) => item.textContent === '')
const back = () => act(() => arrows()[0].click())
const forward = () => act(() => arrows()[1].click())
const values = () => chart.data.map((item) => item.value)
const labels = () => chart.data.map((item) => item.label)
const shownLabels = () => labels().filter(Boolean)
const text = () => container.textContent

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  chart.data = null
  chart.tick = null
  chart.domain = null
  chart.hover = null
  popup.props = null
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

describe('PersonsTimelineChartCard — counting people', () => {
  it('counts the people seen each day, not their events', () => {
    render([
      person('ana', '2024.06.10', '2024.06.10', '2024.06.12'),
      person('bob', '2024.06.10'),
      person('cy', '2024.06.16'),
    ])
    expect(values()).toEqual([2, 0, 1, 0, 0, 0, 1])
  })

  it('counts a person once per month in the year view, however many days they appear', () => {
    render([
      person('ana', '2024.06.01', '2024.06.02', '2024.06.12', '2024.01.05'),
      person('bob', '2024.06.12'),
    ])
    show(t.granYear)
    expect(values()).toEqual([1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0])
  })

  it('still counts that person on each of their days in the month view', () => {
    render([person('ana', '2024.06.01', '2024.06.02', '2024.06.02')])
    show(t.granMonth)
    expect(values().slice(0, 3)).toEqual([1, 1, 0])
  })

  it('ignores undated events and people without events', () => {
    render([
      person('ana', '2024.06.12', ''),
      { id: 'bob', name: 'bob' },
      { id: 'cy', name: 'cy', events: [{ id: 'x' }] },
    ])
    expect(values()).toEqual([0, 0, 1, 0, 0, 0, 0])
  })
})

describe('PersonsTimelineChartCard — periods', () => {
  it('starts on the current week, Monday to Sunday', () => {
    render([])
    expect(labels()).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(popup.props).toMatchObject({
      gran: 'week',
      offset: 0,
      locale: 'en-GB',
      title: '10 Jun – 16 Jun 2024',
    })
  })

  it('moves back a week and forward again, but not past the current one', () => {
    render([person('ana', '2024.06.04', '2024.06.12')])
    expect(arrows()[1].disabled).toBe(true)
    back()
    expect(popup.props).toMatchObject({ offset: -1, title: '3 Jun – 9 Jun 2024' })
    expect(values()).toEqual([0, 1, 0, 0, 0, 0, 0])
    forward()
    expect(values()).toEqual([0, 0, 1, 0, 0, 0, 0])
  })

  it('jumps to the period picked in the calendar', () => {
    render([person('ana', '2024.05.01')])
    act(() => popup.props.onOffsetChange(-6))
    expect(values()).toEqual([0, 0, 1, 0, 0, 0, 0])
  })

  it('shows one bar per day of the month, labelling four of them', () => {
    render([person('ana', '2024.06.30'), person('bob', '2024.06.30')])
    show(t.granMonth)
    expect(popup.props).toMatchObject({ gran: 'month', title: 'June 2024' })
    expect(values()).toHaveLength(30)
    expect(values()[29]).toBe(2)
    expect(shownLabels()).toEqual(['01-06', '10-06', '20-06', '30-06'])
    back()
    expect(popup.props.title).toBe('May 2024')
    expect(values()).toHaveLength(31)
  })

  it('shows one bar per month of the year', () => {
    render([person('ana', '2023.06.12')])
    show(t.granYear)
    expect(popup.props).toMatchObject({ gran: 'year', title: '2024' })
    expect(labels()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
    back()
    expect(popup.props.title).toBe('2023')
    expect(values()[5]).toBe(1)
  })

  it('returns to the current period when the granularity changes', () => {
    render([])
    back()
    show(t.granYear)
    expect(popup.props.offset).toBe(0)
  })

  it('uses Spanish day names and locale for Spanish', () => {
    render([], 'es')
    expect(labels()[0]).toBe('Lun')
    expect(popup.props.locale).toBe('es-ES')
  })
})

describe('PersonsTimelineChartCard — historic', () => {
  it('has no navigation and shows a dash without events', () => {
    render([person('ana')])
    show(t.granHistoric)
    expect(arrows()).toHaveLength(0)
    expect(chart.data).toEqual([])
    expect(text()).toContain('—')
  })

  it('spans from the first to the last event of anyone', () => {
    render([person('ana', '2024.06.05'), person('bob', '2024.06.03', '2024.06.05')])
    show(t.granHistoric)
    expect(text()).toContain('3 Jun 2024 – 5 Jun 2024')
    expect(labels()).toEqual(['Mon', 'Tue', 'Wed'])
    expect(values()).toEqual([1, 0, 2])
  })

  it('shows a single day when everything happened on one date', () => {
    render([person('ana', '2024.06.05'), person('bob', '2024.06.05')])
    show(t.granHistoric)
    expect(values()).toEqual([2])
    expect(text()).not.toContain('–')
  })

  it('shows every day up to a year, labelling the first of each month', () => {
    render([person('ana', '2024.01.30', '2024.03.02')])
    show(t.granHistoric)
    expect(values()).toHaveLength(33)
    expect(shownLabels()).toEqual(['Feb', 'Mar'])
    expect(chart.data[0].tooltipLabel).toBe('30-01')
  })

  it('switches to months beyond a year, counting each person once per month', () => {
    render([person('ana', '2022.11.15', '2022.11.20', '2024.02.10'), person('bob', '2022.11.01')])
    show(t.granHistoric)
    expect(values()).toHaveLength(16)
    expect(values()[0]).toBe(2)
    expect(values().at(-1)).toBe(1)
    expect(shownLabels()).toEqual(['2023', '2024'])
    expect(chart.data[0].tooltipLabel).toBe('Nov 2022')
  })

  it('thins the year labels down to five on a long history', () => {
    render([person('ana', '2010.03.01', '2020.12.01')])
    show(t.granHistoric)
    expect(shownLabels()).toEqual(['2011', '2013', '2016', '2018', '2020'])
  })
})

describe('PersonsTimelineChartCard — summary', () => {
  it('is titled as the people timeline', () => {
    render([])
    expect(text()).toContain(t.personsTimelineTitle)
  })

  it('averages people over the bars of the period', () => {
    render([person('ana', '2024.06.10', '2024.06.11'), person('bob', '2024.06.10')])
    expect(text()).toContain(`0.4 ${t.chartPersons} ${t.timelineAvg}`)
  })

  it('uses the singular for an average of exactly one', () => {
    render([person('ana', ...Array.from({ length: 7 }, (_, i) => `2024.06.${10 + i}`))])
    expect(text()).toContain(`1 ${t.chartPerson} ${t.timelineAvg}`)
  })

  it('scales the axis to the busiest bar, never below one', () => {
    render([person('ana', '2024.06.12'), person('bob', '2024.06.12')])
    expect(chart.domain).toEqual([0, 2])
    back()
    expect(chart.domain).toEqual([0, 1])
  })

  it('says there is no data when every bar is empty', () => {
    render([person('ana', '2020.01.01')])
    expect(text()).toContain(t.noDataYet)
    show(t.granHistoric)
    expect(text()).not.toContain(t.noDataYet)
  })

  it('labels the axis from the bar labels', () => {
    render([])
    expect(chart.tick(null, 0)).toBe('Mon')
    expect(chart.tick(null, 99)).toBe('')
  })
})

describe('PersonsTimelineChartCard — tooltip', () => {
  const hover = (value, tooltipLabel) => ({
    active: true,
    payload: [{ payload: { value, tooltipLabel } }],
  })
  const tooltip = () => container.querySelector('[data-chart]').textContent

  it('says there were no people on an empty bar', () => {
    chart.hover = hover(0, 'Monday')
    render([])
    expect(tooltip()).toBe(t.noPersons)
  })

  it('counts one person in the singular', () => {
    chart.hover = hover(1, 'Monday')
    render([])
    expect(tooltip()).toBe(`1 ${t.chartPerson} ${t.timelineOn} Monday`)
  })

  it('counts several people in the plural', () => {
    chart.hover = hover(4, '12-06')
    render([])
    expect(tooltip()).toBe(`4 ${t.chartPersons} ${t.timelineOn} 12-06`)
  })

  it('is hidden while inactive', () => {
    chart.hover = { active: false, payload: [{ payload: { value: 2 } }] }
    render([])
    expect(tooltip()).toBe('')
  })
})
