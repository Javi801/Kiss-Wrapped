// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { CHART_COLORS } from '@/lib/constants'
import { getColorForCategory } from '@/lib/format'

// Props of the mocked chart parts, and the hover state fed to the tooltip.
const chart = vi.hoisted(() => ({
  main: null,
  x: null,
  y: null,
  tooltip: null,
  fills: [],
  hover: null,
}))
const palette = vi.hoisted(() => ({ current: {} }))

vi.mock('@/lib/theme', () => ({ usePalette: () => palette.current }))
vi.mock('@/components/charts/FullscreenChartWrapper', () => ({
  default: ({ children }) => children,
}))
vi.mock('recharts', async () => {
  const { createElement, cloneElement } = await import('react')
  const main = (props) => {
    chart.main = props
    return createElement('div', { 'data-chart': true }, props.children)
  }
  return {
    ResponsiveContainer: ({ children }) => children,
    AreaChart: main,
    RadarChart: main,
    PieChart: ({ children }) => createElement('div', { 'data-chart': true }, children),
    Pie: (props) => {
      chart.main = props
      return props.children
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
      return props.content && chart.hover ? cloneElement(props.content, chart.hover) : null
    },
    Cell: ({ fill }) => {
      chart.fills.push(fill)
      return null
    },
    Area: () => null,
    Radar: () => null,
    CartesianGrid: () => null,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    PolarRadiusAxis: () => null,
  }
})

import AreaChartCard from '@/components/charts/AreaChartCard'
import PieChartCard from '@/components/charts/PieChartCard'
import RadarChartCard from '@/components/charts/RadarChartCard'
import { FullscreenContext } from '@/components/charts/FullscreenContext'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const UNIT = { one: 'person', many: 'people' }
const rows = (count) =>
  Array.from({ length: count }, (_, i) => ({ label: String(18 + i), value: i }))

let container
let root

function render(Card, props = {}, { fullscreen = false } = {}) {
  chart.fills = []
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <FullscreenContext.Provider value={fullscreen}>
        <Card title="Card title" subtitle="Card subtitle" emptyText="Nothing yet" {...props} />
      </FullscreenContext.Provider>
    )
  })
}

function rerender(...args) {
  act(() => root.unmount())
  container.remove()
  render(...args)
}

const tooltip = () => container.querySelector('[data-chart]').textContent

beforeEach(() => {
  palette.current = {}
  chart.main = null
  chart.x = null
  chart.y = null
  chart.tooltip = null
  chart.hover = null
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('AreaChartCard', () => {
  it('shows the title, the subtitle and the given rows', () => {
    const data = rows(5)
    render(AreaChartCard, { data })
    expect(container.textContent).toContain('Card title')
    expect(container.textContent).toContain('Card subtitle')
    expect(chart.main.data).toBe(data)
  })

  it('shows the empty text without data', () => {
    render(AreaChartCard, { data: [] })
    expect(container.textContent).toContain('Nothing yet')
    expect(container.querySelector('[data-chart]')).toBeNull()
  })

  it.each([
    [3, 0],
    [8, 0],
    [16, 1],
    [40, 4],
  ])('labels about eight points out of %i (skipping %i between labels)', (count, interval) => {
    render(AreaChartCard, { data: rows(count) })
    expect(chart.x.interval).toBe(interval)
  })

  it('leaves headroom above the highest point and starts at zero', () => {
    render(AreaChartCard, { data: rows(5) })
    const [min, max] = chart.y.domain
    expect(min).toBe(0)
    expect(max(7)).toBe(8)
    expect(chart.y.allowDecimals).toBe(false)
  })

  it('has a fixed height in the card and a free one in fullscreen', () => {
    render(AreaChartCard, { data: rows(5) })
    const height = () => container.querySelector('[data-bar-chart-container]').style.height
    expect(height()).toBe('16rem')
    rerender(AreaChartCard, { data: rows(5) }, { fullscreen: true })
    expect(height()).toBe('')
  })

  it('names the point and counts in the given unit', () => {
    chart.hover = { active: true, label: '25', payload: [{ value: 3 }] }
    render(AreaChartCard, { data: rows(5), tooltipUnit: UNIT })
    expect(tooltip()).toBe('253 people')
  })

  it('uses the singular for one', () => {
    chart.hover = { active: true, label: '25', payload: [{ value: 1 }] }
    render(AreaChartCard, { data: rows(5), tooltipUnit: UNIT })
    expect(tooltip()).toBe('251 person')
  })

  it.each([
    ['inactive', { active: false, payload: [{ value: 3 }] }],
    ['without a payload', { active: true }],
  ])('hides the tooltip while %s', (_case, hover) => {
    chart.hover = hover
    render(AreaChartCard, { data: rows(5), tooltipUnit: UNIT })
    expect(tooltip()).toBe('')
  })

  it('falls back to the default tooltip without a unit', () => {
    render(AreaChartCard, { data: rows(5) })
    expect(chart.tooltip.content).toBeUndefined()
  })
})

describe('PieChartCard', () => {
  const data = [
    { label: 'Scored', value: 6 },
    { label: 'Unscored', value: 2 },
  ]
  // Legend entries read "label: value".
  const legend = () =>
    [...container.querySelectorAll('span')]
      .map((node) => node.textContent)
      .filter((text) => /: \d+$/.test(text))

  it('shows the title, the subtitle and the given rows', () => {
    render(PieChartCard, { data })
    expect(container.textContent).toContain('Card title')
    expect(container.textContent).toContain('Card subtitle')
    expect(chart.main).toMatchObject({ data, dataKey: 'value', nameKey: 'label' })
  })

  it('lists every slice with its value', () => {
    render(PieChartCard, { data })
    expect(legend()).toEqual(['Scored: 6', 'Unscored: 2'])
  })

  it('shows the empty text without data', () => {
    render(PieChartCard, { data: [] })
    expect(container.textContent).toContain('Nothing yet')
    expect(container.querySelector('[data-chart]')).toBeNull()
  })

  it('colors the slices with the default chart colors, in order', () => {
    render(PieChartCard, { data })
    expect(chart.fills).toEqual([CHART_COLORS[0], CHART_COLORS[1]])
  })

  it('prefers the chart colors of the active theme and cycles them', () => {
    palette.current = { chartColors: ['#111111', '#222222'] }
    render(PieChartCard, { data: [...data, { label: 'Skipped', value: 1 }] })
    expect(chart.fills).toEqual(['#111111', '#222222', '#111111'])
  })

  it('keeps the fixed color of a gender slice, whatever its position', () => {
    palette.current = { chartColors: ['#111111', '#222222'] }
    render(PieChartCard, {
      data: [
        { label: 'Scored', value: 1 },
        { label: 'Female', value: 2 },
      ],
    })
    expect(chart.fills[0]).toBe('#111111')
    expect(chart.fills[1]).toBe(getColorForCategory('Female'))
    expect(chart.fills[1]).not.toBe('#222222')
  })

  it('counts in the given unit', () => {
    render(PieChartCard, { data, tooltipUnit: UNIT })
    expect(chart.tooltip.content.props.tooltipUnit).toBe(UNIT)
  })

  it('falls back to the default tooltip without a unit', () => {
    render(PieChartCard, { data })
    expect(chart.tooltip.content).toBeUndefined()
  })

  it('draws a larger pie in fullscreen', () => {
    render(PieChartCard, { data })
    const regular = chart.main.outerRadius
    rerender(PieChartCard, { data }, { fullscreen: true })
    expect(chart.main.outerRadius).toBeGreaterThan(regular)
  })
})

describe('RadarChartCard', () => {
  const data = [
    { label: 'Aries', value: 2 },
    { label: 'Leo', value: 0 },
  ]

  it('shows the title, the subtitle and the given rows', () => {
    render(RadarChartCard, { data })
    expect(container.textContent).toContain('Card title')
    expect(container.textContent).toContain('Card subtitle')
    expect(chart.main.data).toBe(data)
  })

  it.each([
    ['every value is zero', [{ label: 'Aries', value: 0 }]],
    ['there are no rows', []],
  ])('shows the empty text when %s', (_case, rowsGiven) => {
    render(RadarChartCard, { data: rowsGiven })
    expect(container.textContent).toContain('Nothing yet')
    expect(container.querySelector('[data-chart]')).toBeNull()
  })

  it('names the axis and counts in the given unit', () => {
    chart.hover = { active: true, payload: [{ value: 2, payload: { label: 'Aries' } }] }
    render(RadarChartCard, { data, tooltipUnit: UNIT })
    expect(tooltip()).toBe('Aries2 people')
  })

  it('uses the singular for one', () => {
    chart.hover = { active: true, payload: [{ value: 1, payload: { label: 'Aries' } }] }
    render(RadarChartCard, { data, tooltipUnit: UNIT })
    expect(tooltip()).toBe('Aries1 person')
  })

  it('hides the tooltip while inactive', () => {
    chart.hover = { active: false, payload: [{ value: 1, payload: { label: 'Aries' } }] }
    render(RadarChartCard, { data, tooltipUnit: UNIT })
    expect(tooltip()).toBe('')
  })

  it('falls back to the default tooltip without a unit', () => {
    render(RadarChartCard, { data })
    expect(chart.tooltip.content).toBeUndefined()
  })
})
