// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { CHART_COLORS } from '@/lib/constants'

const chart = vi.hoisted(() => ({ bar: null, x: null, y: null, tooltip: null, fills: [] }))
const palette = vi.hoisted(() => ({ current: {} }))

vi.mock('@/lib/theme', () => ({ usePalette: () => palette.current }))
vi.mock('@/components/charts/FullscreenChartWrapper', () => ({
  default: ({ children }) => children,
}))
vi.mock('recharts', async () => {
  const { createElement } = await import('react')
  return {
    ResponsiveContainer: ({ children }) => children,
    BarChart: (props) => {
      chart.bar = props
      return createElement('div', { 'data-chart': true }, props.children)
    },
    XAxis: (props) => {
      chart.x = props
      return null
    },
    YAxis: (props) => {
      chart.y = props
      return null
    },
    Tooltip: (props) => {
      chart.tooltip = props
      return null
    },
    Bar: ({ children }) => children,
    Cell: ({ fill }) => {
      chart.fills.push(fill)
      return null
    },
    CartesianGrid: () => null,
  }
})

import BarChartCard from '@/components/charts/BarChartCard'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const rows = (...labels) => labels.map((label) => ({ label: String(label), value: 1 }))
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
const few = rows('Ana', 'Bob', 'Cy')

let container
let root
let observers

function render(props = {}) {
  chart.fills = []
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <BarChartCard
        title="Ranking"
        subtitle="Most events"
        data={few}
        emptyText="No data"
        {...props}
      />
    )
  })
}

const resizeTo = (width) =>
  act(() => {
    chart.fills = []
    observers.forEach((observer) => observer.callback([{ contentRect: { width } }]))
  })

beforeEach(() => {
  palette.current = {}
  chart.bar = null
  chart.x = null
  chart.y = null
  chart.tooltip = null
  observers = []
  globalThis.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback
      this.disconnect = vi.fn()
      observers.push(this)
    }
    observe() {}
  }
})

afterEach(() => {
  if (root) act(() => root.unmount())
  container.remove()
  delete globalThis.ResizeObserver
})

describe('BarChartCard — frame', () => {
  it('shows the title and subtitle', () => {
    render()
    expect(container.textContent).toContain('Ranking')
    expect(container.textContent).toContain('Most events')
  })

  it('shows the empty text without data', () => {
    render({ data: [] })
    expect(container.textContent).toContain('No data')
    expect(container.querySelector('[data-chart]')).toBeNull()
  })

  it('renders a header action next to the title', () => {
    render({ headerAction: <button>Switch</button> })
    expect(container.textContent).toContain('Ranking')
    expect(container.querySelector('button').textContent).toBe('Switch')
  })

  it('renders tabs under the header', () => {
    render({ tabs: <nav>tabs here</nav> })
    expect(container.querySelector('nav').textContent).toBe('tabs here')
  })

  it('plots the given rows', () => {
    render()
    expect(chart.bar.data).toBe(few)
  })
})

describe('BarChartCard — bar colors', () => {
  it('cycles through the default chart colors', () => {
    render({ data: rows(...range(1, CHART_COLORS.length + 1)) })
    expect(chart.fills.slice(0, 2)).toEqual([CHART_COLORS[0], CHART_COLORS[1]])
    expect(chart.fills.at(-1)).toBe(CHART_COLORS[0])
  })

  it('prefers the chart colors of the active theme', () => {
    palette.current = { chartColors: ['#111111', '#222222'] }
    render()
    expect(chart.fills).toEqual(['#111111', '#222222', '#111111'])
  })

  it('uses a custom color for the labels that have one', () => {
    palette.current = { chartColors: ['#111111', '#222222'] }
    render({ customColors: { Bob: '#00ff00' } })
    expect(chart.fills).toEqual(['#111111', '#00ff00', '#111111'])
  })
})

describe('BarChartCard — tooltip', () => {
  it('counts in the given unit', () => {
    const tooltipUnit = { one: 'event', many: 'events' }
    render({ tooltipUnit })
    expect(chart.tooltip.content.props.tooltipUnit).toBe(tooltipUnit)
  })

  it('falls back to the default tooltip without a unit', () => {
    render()
    expect(chart.tooltip.content).toBeUndefined()
  })
})

describe('BarChartCard — vertical axis labels', () => {
  it('shows every label when they are few', () => {
    render()
    expect(chart.x.ticks).toBeUndefined()
    expect(chart.x.dataKey).toBe('label')
  })

  it('thins numeric labels to round steps', () => {
    render({ data: rows(...range(0, 40)) })
    expect(chart.x.ticks).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40'])
  })

  it('starts at the first round value inside the data', () => {
    render({ data: rows(...range(18, 58)) })
    expect(chart.x.ticks).toEqual(['20', '25', '30', '35', '40', '45', '50', '55'])
  })

  it('shows fewer labels on a narrow card', () => {
    render({ data: rows(...range(0, 40)) })
    resizeTo(200)
    expect(chart.x.ticks).toEqual(['0', '10', '20', '30', '40'])
  })

  it('shows more labels on a wide card', () => {
    render({ data: rows(...range(0, 40)) })
    resizeTo(1000)
    expect(chart.x.ticks).toEqual(range(0, 20).map((n) => String(n * 2)))
  })

  it('never goes below two labels', () => {
    render({ data: rows(...range(0, 40)) })
    resizeTo(10)
    expect(chart.x.ticks.length).toBeGreaterThanOrEqual(2)
  })

  it('respects a maximum number of labels', () => {
    render({ data: rows(...range(0, 40)), maxXTicks: 3 })
    expect(chart.x.ticks).toEqual(['0', '20', '40'])
  })

  it('respects a wider minimum spacing between labels', () => {
    render({ data: rows(...range(0, 40)), tickMinSpacing: 100 })
    resizeTo(200)
    expect(chart.x.ticks).toEqual(['0', '20', '40'])
  })

  it('only labels values that exist in the data', () => {
    render({ data: rows(...range(0, 40).filter((n) => n !== 10)) })
    expect(chart.x.ticks).not.toContain('10')
    expect(chart.x.ticks).toContain('5')
  })

  it('picks evenly spread names when the labels are not numbers', () => {
    const names = range(1, 22).map((n) => `Person ${n}`)
    render({ data: rows(...names) })
    expect(chart.x.ticks).toHaveLength(8)
    expect(chart.x.ticks[0]).toBe('Person 1')
    expect(chart.x.ticks.at(-1)).toBe('Person 22')
  })

  it('shows every label when asked to', () => {
    render({ data: rows(...range(0, 40)), showAllTicks: true })
    expect(chart.x.ticks).toBeUndefined()
  })

  it('keeps labels straight by default and tilts them on request', () => {
    render()
    expect(chart.x).toMatchObject({ angle: 0, textAnchor: 'middle' })
    act(() => root.unmount())
    container.remove()
    render({ rotateXLabels: true })
    expect(chart.x).toMatchObject({ angle: -24, textAnchor: 'end' })
    expect(chart.x.height).toBeGreaterThan(30)
  })

  it('titles the axes when asked to', () => {
    render({ xAxisLabel: 'Years', yAxisLabel: 'People' })
    expect(chart.x.label.value).toBe('Years')
    expect(chart.y.label.value).toBe('People')
  })

  it('leaves the axes untitled by default', () => {
    render()
    expect(chart.x.label).toBeUndefined()
    expect(chart.y.label).toBeUndefined()
  })

  it('never shows fractional counts', () => {
    render()
    expect(chart.y.allowDecimals).toBe(false)
  })
})

describe('BarChartCard — horizontal', () => {
  const labelColumn = () =>
    [...container.querySelectorAll('[title]')].map((node) => node.getAttribute('title'))

  it('lays the bars out sideways with the names in their own column', () => {
    render({ horizontal: true })
    expect(chart.bar.layout).toBe('vertical')
    expect(labelColumn()).toEqual(['Ana', 'Bob', 'Cy'])
    expect(chart.x).toMatchObject({ type: 'number', allowDecimals: false })
    expect(chart.y).toMatchObject({ dataKey: 'label', type: 'category' })
  })

  it('keeps a minimum height for a few rows and grows with many', () => {
    render({ horizontal: true })
    const short = chart.bar.height
    act(() => root.unmount())
    container.remove()
    render({ horizontal: true, data: rows(...range(1, 12)) })
    expect(short).toBe(200)
    expect(chart.bar.height).toBe(12 * 36)
  })

  it('gives the plot the width left beside the names', () => {
    render({ horizontal: true })
    const initial = chart.bar.width
    resizeTo(500)
    expect(chart.bar.width).toBe(420)
    resizeTo(100)
    expect(chart.bar.width).toBe(initial)
  })

  it('colors the bars like the vertical chart', () => {
    palette.current = { chartColors: ['#111111', '#222222'] }
    render({ horizontal: true, customColors: { Cy: '#00ff00' } })
    expect(chart.fills).toEqual(['#111111', '#222222', '#00ff00'])
  })

  it('counts in the given unit', () => {
    const tooltipUnit = { one: 'event', many: 'events' }
    render({ horizontal: true, tooltipUnit })
    expect(chart.tooltip.content.props.tooltipUnit).toBe(tooltipUnit)
  })

  it('falls back to the default tooltip without a unit', () => {
    render({ horizontal: true })
    expect(chart.tooltip.content).toBeUndefined()
  })

  it('tolerates rows without a label', () => {
    render({ horizontal: true, data: [{ value: 2 }, { label: 'Ana', value: 1 }] })
    expect(chart.bar.data).toHaveLength(2)
  })
})

describe('BarChartCard — cleanup', () => {
  it.each([false, true])('stops observing its size when removed (horizontal: %s)', (horizontal) => {
    render({ horizontal })
    expect(observers.length).toBeGreaterThan(0)
    act(() => root.unmount())
    root = null
    observers.forEach((observer) => expect(observer.disconnect).toHaveBeenCalled())
  })
})
