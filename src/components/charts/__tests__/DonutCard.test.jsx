// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { CHART_COLORS } from '@/lib/constants'

const chart = vi.hoisted(() => ({ pie: null, fills: [], tooltip: null }))
const palette = vi.hoisted(() => ({ current: {} }))

vi.mock('@/lib/theme', () => ({ usePalette: () => palette.current }))
vi.mock('@/components/charts/FullscreenChartWrapper', () => ({
  default: ({ children }) => children,
}))
vi.mock('recharts', async () => {
  const { createElement } = await import('react')
  return {
    ResponsiveContainer: ({ children }) => children,
    PieChart: ({ children }) => createElement('div', { 'data-chart': true }, children),
    Pie: (props) => {
      chart.pie = props
      return props.children
    },
    Cell: ({ fill }) => {
      chart.fills.push(fill)
      return null
    },
    Tooltip: ({ content }) => {
      chart.tooltip = content.props
      return null
    },
  }
})

import DonutCard from '@/components/charts/DonutCard'
import { FullscreenContext } from '@/components/charts/FullscreenContext'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const modes = {
  persons: {
    data: [
      { label: 'Women', value: 3 },
      { label: 'Men', value: 1 },
    ],
    title: 'People by gender',
    subtitle: 'Gender split',
    label: 'People',
    tooltipUnit: { one: 'person', many: 'people' },
  },
  events: {
    data: [{ label: 'Women', value: 9 }],
    title: 'Events by gender',
    subtitle: 'Events split',
    label: 'Events',
    tooltipUnit: { one: 'event', many: 'events' },
  },
}

let container
let root

function render(props = {}, { fullscreen = false } = {}) {
  chart.fills = []
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <FullscreenContext.Provider value={fullscreen}>
        <DonutCard modes={modes} order={['persons', 'events']} emptyText="Nothing yet" {...props} />
      </FullscreenContext.Provider>
    )
  })
}

const buttons = () => [...container.querySelectorAll('button')]
const switchTo = (label) =>
  act(() => {
    chart.fills = []
    buttons()
      .find((button) => button.textContent === label)
      .click()
  })
// Legend entries read "label: value".
const legend = () =>
  [...container.querySelectorAll('span')]
    .map((node) => node.textContent)
    .filter((text, index, all) => /: \d+$/.test(text) && all.indexOf(text) === index)

beforeEach(() => {
  chart.pie = null
  chart.tooltip = null
  palette.current = {}
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('DonutCard — modes', () => {
  it('starts on the first mode of the given order', () => {
    render()
    expect(container.textContent).toContain('People by gender')
    expect(container.textContent).toContain('Gender split')
    expect(chart.pie.data).toBe(modes.persons.data)
    expect(chart.tooltip.tooltipUnit).toEqual(modes.persons.tooltipUnit)
  })

  it('respects a different order', () => {
    render({ order: ['events', 'persons'] })
    expect(buttons().map((button) => button.textContent)).toEqual(['Events', 'People'])
    expect(chart.pie.data).toBe(modes.events.data)
  })

  it('switches the title, data and unit with the mode', () => {
    render()
    switchTo('Events')
    expect(container.textContent).toContain('Events by gender')
    expect(container.textContent).not.toContain('People by gender')
    expect(chart.pie.data).toBe(modes.events.data)
    expect(chart.tooltip.tooltipUnit).toEqual(modes.events.tooltipUnit)
  })

  it('plots values by label', () => {
    render()
    expect(chart.pie).toMatchObject({ dataKey: 'value', nameKey: 'label' })
  })
})

describe('DonutCard — legend and colors', () => {
  it('lists every slice with its value', () => {
    render()
    expect(legend()).toEqual(['Women: 3', 'Men: 1'])
    switchTo('Events')
    expect(legend()).toEqual(['Women: 9'])
  })

  it('colors the slices with the default chart colors, in order', () => {
    render()
    expect(chart.fills).toEqual([CHART_COLORS[0], CHART_COLORS[1]])
  })

  it('prefers the chart colors of the active theme', () => {
    palette.current = { chartColors: ['#111111', '#222222'] }
    render()
    expect(chart.fills).toEqual(['#111111', '#222222'])
  })

  it('cycles the colors when there are more slices than colors', () => {
    palette.current = { chartColors: ['#111111', '#222222'] }
    const data = ['a', 'b', 'c'].map((label) => ({ label, value: 1 }))
    render({ modes: { ...modes, persons: { ...modes.persons, data } } })
    expect(chart.fills).toEqual(['#111111', '#222222', '#111111'])
  })

  it('lets the caller choose each slice color', () => {
    const colorFn = vi.fn((entry, index) => `${entry.label}-${index}`)
    render({ colorFn })
    expect(chart.fills).toEqual(['Women-0', 'Men-1'])
  })
})

describe('DonutCard — empty and sizing', () => {
  it('shows the empty text when the active mode has no data', () => {
    render({ modes: { ...modes, persons: { ...modes.persons, data: [] } } })
    expect(container.textContent).toContain('Nothing yet')
    expect(container.querySelector('[data-chart]')).toBeNull()
    expect(legend()).toEqual([])
  })

  it('decides emptiness per mode', () => {
    render({ modes: { ...modes, persons: { ...modes.persons, data: [] } } })
    switchTo('Events')
    expect(container.textContent).not.toContain('Nothing yet')
    expect(container.querySelector('[data-chart]')).not.toBeNull()
  })

  it('draws a larger donut in fullscreen', () => {
    render()
    const regular = chart.pie.outerRadius
    act(() => root.unmount())
    container.remove()
    render({}, { fullscreen: true })
    expect(chart.pie.outerRadius).toBeGreaterThan(regular)
    expect(chart.pie.innerRadius).toBeLessThan(chart.pie.outerRadius)
  })
})
