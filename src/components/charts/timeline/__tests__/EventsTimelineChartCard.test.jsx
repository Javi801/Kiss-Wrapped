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

import EventsTimelineChartCard from '@/components/charts/timeline/EventsTimelineChartCard'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en
// Wednesday 12 June 2024; its week runs from Monday 10 to Sunday 16 June.
const NOW = new Date(2024, 5, 12, 12, 0, 0)
const on = (...dates) => dates.map((date, index) => ({ id: `e${index}`, date }))

let container
let root

function render(allEvents, language = 'en') {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <EventsTimelineChartCard allEvents={allEvents} t={COPY[language]} language={language} />
    )
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

describe('EventsTimelineChartCard — week', () => {
  it('starts on the current week, Monday to Sunday', () => {
    render([])
    expect(labels()).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(popup.props).toMatchObject({ gran: 'week', offset: 0, title: '10 Jun – 16 Jun 2024' })
  })

  it('counts the events of each day', () => {
    render(on('2024.06.10', '2024.06.12', '2024.06.12', '2024.06.16', '2024.06.09', '2024.06.17'))
    expect(values()).toEqual([1, 0, 2, 0, 0, 0, 1])
  })

  it('ignores events without a date', () => {
    render([...on('2024.06.12'), { id: 'x' }, { id: 'y', date: '' }])
    expect(values()).toEqual([0, 0, 1, 0, 0, 0, 0])
  })

  it('moves back a week and forward again', () => {
    render(on('2024.06.04', '2024.06.12'))
    back()
    expect(popup.props).toMatchObject({ offset: -1, title: '3 Jun – 9 Jun 2024' })
    expect(values()).toEqual([0, 1, 0, 0, 0, 0, 0])
    forward()
    expect(popup.props.offset).toBe(0)
    expect(values()).toEqual([0, 0, 1, 0, 0, 0, 0])
  })

  it('cannot move past the current week', () => {
    render([])
    expect(arrows()[1].disabled).toBe(true)
    back()
    expect(arrows()[1].disabled).toBe(false)
  })

  it('spans two months and years in the title when the week does', () => {
    render([])
    act(() => popup.props.onOffsetChange(-23))
    expect(popup.props.title).toBe('1 Jan – 7 Jan 2024')
    act(() => popup.props.onOffsetChange(-24))
    expect(popup.props.title).toBe('25 Dec – 31 Dec 2023')
  })

  it('jumps to the week picked in the calendar', () => {
    render(on('2024.05.01'))
    act(() => popup.props.onOffsetChange(-6))
    expect(values()).toEqual([0, 0, 1, 0, 0, 0, 0])
  })

  it('uses Spanish day names and locale for Spanish', () => {
    render([], 'es')
    expect(labels()[0]).toBe('Lun')
    expect(popup.props.locale).toBe('es-ES')
  })

  it('uses the British locale otherwise', () => {
    render([])
    expect(popup.props.locale).toBe('en-GB')
  })
})

describe('EventsTimelineChartCard — month', () => {
  it('shows one bar per day of the current month', () => {
    render(on('2024.06.01', '2024.06.30', '2024.06.30', '2024.05.31'))
    show(t.granMonth)
    expect(popup.props).toMatchObject({ gran: 'month', offset: 0, title: 'June 2024' })
    expect(values()).toHaveLength(30)
    expect(values()[0]).toBe(1)
    expect(values()[29]).toBe(2)
    expect(values().reduce((sum, value) => sum + value, 0)).toBe(3)
  })

  it('labels only four days spread over the month', () => {
    render([])
    show(t.granMonth)
    expect(shownLabels()).toEqual(['01-06', '10-06', '20-06', '30-06'])
    expect(labels()[9]).toBe('10-06')
  })

  it('follows the length of each month', () => {
    render([])
    show(t.granMonth)
    back()
    expect(popup.props.title).toBe('May 2024')
    expect(values()).toHaveLength(31)
    expect(shownLabels()).toEqual(['01-05', '10-05', '21-05', '31-05'])
    act(() => popup.props.onOffsetChange(-4))
    expect(popup.props.title).toBe('February 2024')
    expect(values()).toHaveLength(29)
  })

  it('cannot move past the current month', () => {
    render([])
    show(t.granMonth)
    expect(arrows()[1].disabled).toBe(true)
  })
})

describe('EventsTimelineChartCard — year', () => {
  it('shows one bar per month of the current year', () => {
    render(on('2024.01.15', '2024.06.01', '2024.06.12', '2023.06.12'))
    show(t.granYear)
    expect(popup.props).toMatchObject({ gran: 'year', offset: 0, title: '2024' })
    expect(labels()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
    expect(values()).toEqual([1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0])
  })

  it('moves to the previous year', () => {
    render(on('2024.06.12', '2023.06.12'))
    show(t.granYear)
    back()
    expect(popup.props.title).toBe('2023')
    expect(values()[5]).toBe(1)
    expect(arrows()[1].disabled).toBe(false)
  })
})

describe('EventsTimelineChartCard — historic', () => {
  it('has no navigation or calendar', () => {
    render(on('2024.06.12'))
    show(t.granHistoric)
    expect(arrows()).toHaveLength(0)
    expect(text()).toContain('12 Jun 2024')
  })

  it('shows a dash when there are no events', () => {
    render([])
    show(t.granHistoric)
    expect(chart.data).toEqual([])
    expect(text()).toContain('—')
    expect(text()).toContain(t.noDataYet)
  })

  it('shows a single bar when every event is on the same day', () => {
    render(on('2024.06.05', '2024.06.05'))
    show(t.granHistoric)
    expect(values()).toEqual([2])
    expect(text()).toContain('5 Jun 2024')
    expect(text()).not.toContain('–')
  })

  it('shows every day by weekday for a range under a week', () => {
    render(on('2024.06.03', '2024.06.05', '2024.06.05'))
    show(t.granHistoric)
    expect(labels()).toEqual(['Mon', 'Tue', 'Wed'])
    expect(values()).toEqual([1, 0, 2])
    expect(text()).toContain('3 Jun 2024 – 5 Jun 2024')
  })

  it('shows every day for a range up to a year, labelling the first of each month', () => {
    render(on('2024.01.30', '2024.03.02'))
    show(t.granHistoric)
    expect(values()).toHaveLength(33)
    expect(values()[0]).toBe(1)
    expect(values().at(-1)).toBe(1)
    expect(shownLabels()).toEqual(['Feb', 'Mar'])
    expect(chart.data[0].tooltipLabel).toBe('30-01')
  })

  it('still shows days for a range of exactly 365 days', () => {
    render(on('2022.01.01', '2023.01.01'))
    show(t.granHistoric)
    expect(values()).toHaveLength(366)
  })

  it('switches to one bar per month beyond a year, labelling each January', () => {
    render(on('2022.11.15', '2022.11.20', '2024.02.10'))
    show(t.granHistoric)
    expect(values()).toHaveLength(16)
    expect(values()[0]).toBe(2)
    expect(values().at(-1)).toBe(1)
    expect(shownLabels()).toEqual(['2023', '2024'])
    expect(chart.data[0].tooltipLabel).toBe('Nov 2022')
  })

  it('thins the year labels down to five on a long history', () => {
    render(on('2010.03.01', '2020.12.01'))
    show(t.granHistoric)
    expect(shownLabels()).toEqual(['2011', '2013', '2016', '2018', '2020'])
  })

  it('keeps every year label up to five years', () => {
    render(on('2019.03.01', '2024.02.01'))
    show(t.granHistoric)
    expect(shownLabels()).toEqual(['2020', '2021', '2022', '2023', '2024'])
  })
})

describe('EventsTimelineChartCard — summary and controls', () => {
  it('offers the four granularities', () => {
    render([])
    expect(
      buttons()
        .map((item) => item.textContent)
        .filter(Boolean)
    ).toEqual([t.granWeek, t.granMonth, t.granYear, t.granHistoric])
  })

  it('returns to the current period when the granularity changes', () => {
    render([])
    back()
    back()
    show(t.granMonth)
    expect(popup.props.offset).toBe(0)
  })

  it('averages the events over the bars of the period', () => {
    render(on('2024.06.10', '2024.06.11', '2024.06.12'))
    expect(text()).toContain(`0.4 ${t.chartEvents} ${t.timelineAvg}`)
  })

  it('uses the singular for an average of exactly one', () => {
    render(on(...Array.from({ length: 7 }, (_, i) => `2024.06.${10 + i}`)))
    expect(text()).toContain(`1 ${t.chartEvent} ${t.timelineAvg}`)
  })

  it('shows whole averages without decimals', () => {
    render(on(...Array.from({ length: 14 }, (_, i) => `2024.06.${10 + (i % 7)}`)))
    expect(text()).toContain(`2 ${t.chartEvents} ${t.timelineAvg}`)
  })

  it('scales the axis to the busiest bar, never below one', () => {
    render(on('2024.06.12', '2024.06.12', '2024.06.12'))
    expect(chart.domain).toEqual([0, 3])
    show(t.granYear)
    back()
    expect(chart.domain).toEqual([0, 1])
  })

  it('says there is no data when every bar is empty', () => {
    render(on('2020.01.01'))
    expect(text()).toContain(t.noDataYet)
    show(t.granHistoric)
    expect(text()).not.toContain(t.noDataYet)
  })

  it('labels the axis from the bar labels, keeping repeated blanks apart', () => {
    render([])
    show(t.granMonth)
    expect(chart.tick(null, 0)).toBe('01-06')
    expect(chart.tick(null, 1)).toBe('')
    expect(chart.tick(null, 99)).toBe('')
    expect(new Set(chart.data.map((item) => item.xKey)).size).toBe(30)
  })
})

describe('EventsTimelineChartCard — tooltip', () => {
  const hover = (value, tooltipLabel) => ({
    active: true,
    payload: [{ payload: { value, tooltipLabel } }],
  })
  const tooltip = () => container.querySelector('[data-chart]').textContent

  it('says there are no events on an empty bar', () => {
    chart.hover = hover(0, 'Monday')
    render([])
    expect(tooltip()).toBe(t.noEvents)
  })

  it('counts one event in the singular', () => {
    chart.hover = hover(1, 'Monday')
    render([])
    expect(tooltip()).toBe(`1 ${t.chartEvent} ${t.timelineOn} Monday`)
  })

  it('counts several events in the plural', () => {
    chart.hover = hover(4, '12-06')
    render([])
    expect(tooltip()).toBe(`4 ${t.chartEvents} ${t.timelineOn} 12-06`)
  })

  it('gives each bar its full name for the tooltip', () => {
    render([])
    expect(chart.data.map((item) => item.tooltipLabel)[2]).toBe('Wednesday')
    show(t.granYear)
    expect(chart.data.map((item) => item.tooltipLabel).slice(0, 3)).toEqual(['Jan', 'Feb', 'Mar'])
  })

  it.each([
    ['inactive', { active: false, payload: [{ payload: { value: 2 } }] }],
    ['without a payload', { active: true, payload: [] }],
  ])('is hidden while %s', (_case, state) => {
    chart.hover = state
    render([])
    expect(tooltip()).toBe('')
  })
})
