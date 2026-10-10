// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

const palette = vi.hoisted(() => ({ current: {} }))

vi.mock('@/lib/theme', () => ({ usePalette: () => palette.current }))
vi.mock('@/components/charts/FullscreenChartWrapper', () => ({
  default: ({ children }) => children,
}))

import HeatmapChartCard from '@/components/charts/HeatmapChartCard'
import { FullscreenContext } from '@/components/charts/FullscreenContext'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const BASE_PALETTE = { cardSoft: '#eeeeee', accent: '#aa0000' }
const row = (label, yearCounts) => ({ label, yearCounts })
const YEARS = ['2022', '2023', '2024']
const data = [row('Ana', { 2022: 1, 2024: 4 }), row('Bob', { 2023: 2 })]

let container
let root
// The observer created by the card, to simulate the container being resized.
let observers

function render(props = {}, { fullscreen = false } = {}) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <FullscreenContext.Provider value={fullscreen}>
        <HeatmapChartCard
          title="Heatmap"
          subtitle="Events per year"
          data={data}
          allYears={YEARS}
          emptyText="Nobody yet"
          {...props}
        />
      </FullscreenContext.Provider>
    )
  })
}

const resizeTo = (width) =>
  act(() => observers.forEach((observer) => observer.callback([{ contentRect: { width } }])))
const svgs = () => [...container.querySelectorAll('svg')]
// The card draws three SVGs: year labels, person names and the cells.
const yearLabels = () => [...svgs()[0].querySelectorAll('text')].map((node) => node.textContent)
const names = () => [...svgs()[1].querySelectorAll('text')].map((node) => node.textContent)
const cells = () => [...svgs()[2].querySelectorAll('rect')]
const fills = () => cells().map((cell) => cell.getAttribute('fill'))
const counts = () => [...svgs()[2].querySelectorAll('text')]
const scroller = () =>
  [...container.querySelectorAll('div')].find((node) => node.style.overflow === 'auto')

beforeEach(() => {
  palette.current = { ...BASE_PALETTE }
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
  vi.restoreAllMocks()
})

describe('HeatmapChartCard — content', () => {
  it('shows the title and subtitle', () => {
    render()
    expect(container.textContent).toContain('Heatmap')
    expect(container.textContent).toContain('Events per year')
  })

  it('labels every year and every person in the given order', () => {
    render()
    expect(yearLabels()).toEqual(YEARS)
    expect(names()).toEqual(['Ana', 'Bob'])
  })

  it('draws one cell per person and year', () => {
    render()
    expect(cells()).toHaveLength(6)
  })

  it('writes the count only in the years with events', () => {
    render()
    expect(counts().map((node) => node.textContent)).toEqual(['1', '4', '2'])
  })

  it.each([
    ['there are no people', { data: [] }],
    ['there are no years', { allYears: [] }],
  ])('shows the empty text when %s', (_case, props) => {
    render(props)
    expect(container.textContent).toContain('Nobody yet')
    expect(svgs()).toHaveLength(0)
  })
})

describe('HeatmapChartCard — intensity', () => {
  it('leaves empty years in the neutral card color', () => {
    render()
    expect(fills()[1]).toBe('#eeeeee')
    expect(fills()[3]).toBe('#eeeeee')
  })

  it('paints the busiest cell at full strength', () => {
    render()
    expect(fills()[2]).toBe('rgba(226, 115, 150, 1)')
  })

  it('scales the other cells against the busiest one across everybody', () => {
    render()
    // Ana 2022: 1 of 4. Bob 2023: 2 of 4.
    expect(fills()[0]).toBe('rgba(226, 115, 150, 0.3625)')
    expect(fills()[4]).toBe('rgba(226, 115, 150, 0.575)')
  })

  it('uses the heatmap color and curve of the active theme', () => {
    palette.current = {
      ...BASE_PALETTE,
      chartHeatmapRgb: '1, 2, 3',
      chartHeatmapAlphaBase: 0.5,
      chartHeatmapExponent: 2,
    }
    render()
    expect(fills()[2]).toBe('rgba(1, 2, 3, 1)')
    expect(fills()[4]).toBe('rgba(1, 2, 3, 0.625)')
  })

  it('switches the count to white on the strong cells', () => {
    render()
    expect(counts().map((node) => node.getAttribute('fill'))).toEqual([
      '#aa0000',
      'white',
      '#aa0000',
    ])
  })

  it('keeps the accent color at 55% of the maximum and whitens just above it', () => {
    render({
      data: [row('Ana', { 2022: 55, 2023: 56, 2024: 100 })],
    })
    expect(counts().map((node) => node.getAttribute('fill'))).toEqual(['#aa0000', 'white', 'white'])
  })
})

describe('HeatmapChartCard — sizing', () => {
  const dataWidth = () => Number(svgs()[2].getAttribute('width'))

  it('fills the available width when the years fit', () => {
    render()
    const narrow = dataWidth()
    resizeTo(500)
    expect(dataWidth()).toBe(narrow + 200)
  })

  it('keeps a minimum column width so many years scroll sideways', () => {
    const allYears = Array.from({ length: 20 }, (_, i) => String(2005 + i))
    render({ allYears })
    const wide = dataWidth()
    resizeTo(100)
    expect(dataWidth()).toBe(wide)
    expect(wide).toBeGreaterThanOrEqual(20 * 36)
  })

  it('lays the cells out left to right in equal columns', () => {
    render()
    const xs = cells()
      .slice(0, 3)
      .map((cell) => Number(cell.getAttribute('x')))
    expect(xs[1] - xs[0]).toBeCloseTo(xs[2] - xs[1])
    expect(xs[0]).toBeLessThan(xs[1])
  })

  it('stacks one row per person', () => {
    render()
    const ys = cells().map((cell) => Number(cell.getAttribute('y')))
    expect(new Set(ys.slice(0, 3)).size).toBe(1)
    expect(ys[3] - ys[0]).toBe(36)
  })

  it('grows with the rows up to ten, then scrolls inside the card', () => {
    const people = (count) => Array.from({ length: count }, (_, i) => row(`P${i}`, { 2022: 1 }))
    render({ data: people(2) })
    const two = parseFloat(scroller().style.maxHeight)
    act(() => root.unmount())
    container.remove()

    render({ data: people(10) })
    const ten = parseFloat(scroller().style.maxHeight)
    act(() => root.unmount())
    container.remove()

    render({ data: people(25) })
    expect(ten - two).toBe(8 * 36)
    expect(parseFloat(scroller().style.maxHeight)).toBe(ten)
  })

  it('shows every row in fullscreen', () => {
    render({}, { fullscreen: true })
    expect(scroller().style.maxHeight).toBe('')
  })

  it('makes room for long names', () => {
    render()
    const short = Number(svgs()[1].getAttribute('width'))
    act(() => root.unmount())
    container.remove()
    render({ data: [row('A very long nickname indeed', { 2022: 1 })] })
    expect(Number(svgs()[1].getAttribute('width'))).toBeGreaterThan(short)
  })

  it('stops observing its size when removed', () => {
    render()
    const [observer] = observers
    act(() => root.unmount())
    root = null
    expect(observer.disconnect).toHaveBeenCalled()
  })
})

describe('HeatmapChartCard — initial scroll', () => {
  function overflowBy(scrollWidth, clientWidth) {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth)
  }

  it('starts at the most recent years when the chart overflows', () => {
    overflowBy(900, 300)
    render()
    expect(scroller().scrollLeft).toBe(900)
  })

  it('does not scroll when everything fits', () => {
    overflowBy(300, 300)
    render()
    expect(scroller().scrollLeft).toBe(0)
  })

  it('does not fight the user after the first scroll', () => {
    overflowBy(900, 300)
    render()
    scroller().scrollLeft = 120
    resizeTo(280)
    expect(scroller().scrollLeft).toBe(120)
  })
})
