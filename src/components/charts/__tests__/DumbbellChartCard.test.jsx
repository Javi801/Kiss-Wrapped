// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

const wrapper = vi.hoisted(() => ({ props: null }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({ accent: '#aa0000', cardBorder: '#cccccc' }) }))
vi.mock('@/components/charts/FullscreenChartWrapper', () => ({
  default: (props) => {
    wrapper.props = props
    return props.children
  },
}))

import DumbbellChartCard from '@/components/charts/DumbbellChartCard'
import { FullscreenContext } from '@/components/charts/FullscreenContext'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const row = (label, years) => ({ label, years })
const YEARS = ['2020', '2021', '2022', '2023']
const data = [row('Ana', ['2020', '2021', '2023']), row('Bob', ['2021', '2022'])]

let container
let root
let observers

function render(props = {}, { fullscreen = false } = {}) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <FullscreenContext.Provider value={fullscreen}>
        <DumbbellChartCard
          title="Years seen"
          subtitle="Per person"
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
// The card draws three SVGs: year labels, person names and the data area.
const yearLabels = () => [...svgs()[0].querySelectorAll('text')]
const names = () => [...svgs()[1].querySelectorAll('text')].map((node) => node.textContent)
const dots = () => [...svgs()[2].querySelectorAll('circle')]
const num = (node, attribute) => Number(node.getAttribute(attribute))
// Links between consecutive years are the only accent-colored lines.
const links = () =>
  [...svgs()[2].querySelectorAll('line')].filter(
    (line) => line.getAttribute('stroke') === '#aa0000'
  )
const yearX = () =>
  Object.fromEntries(yearLabels().map((node) => [node.textContent, num(node, 'x')]))
const scroller = () =>
  [...container.querySelectorAll('div')].find((node) => node.style.overflow === 'auto')

beforeEach(() => {
  wrapper.props = null
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

describe('DumbbellChartCard — content', () => {
  it('shows the title and subtitle', () => {
    render()
    expect(container.textContent).toContain('Years seen')
    expect(container.textContent).toContain('Per person')
  })

  it('labels every year and every person in the given order', () => {
    render()
    expect(yearLabels().map((node) => node.textContent)).toEqual(YEARS)
    expect(names()).toEqual(['Ana', 'Bob'])
  })

  it('draws one dot per person and year they appear in', () => {
    render()
    expect(dots()).toHaveLength(5)
  })

  it('places each dot under its year, on the row of its person', () => {
    render()
    const x = yearX()
    const positions = dots().map((dot) => [num(dot, 'cx'), num(dot, 'cy')])
    const [anaRow, bobRow] = [positions[0][1], positions[3][1]]
    expect(positions).toEqual([
      [x['2020'], anaRow],
      [x['2021'], anaRow],
      [x['2023'], anaRow],
      [x['2021'], bobRow],
      [x['2022'], bobRow],
    ])
    expect(bobRow - anaRow).toBe(36)
  })

  it('links only consecutive years', () => {
    render()
    const x = yearX()
    const spans = links().map((line) => [num(line, 'x1'), num(line, 'x2')])
    // Ana: 2020–2021 (2023 stands alone). Bob: 2021–2022.
    expect(spans).toEqual([
      [x['2020'], x['2021']],
      [x['2021'], x['2022']],
    ])
  })

  it('orders the years of a person before linking them', () => {
    render({ data: [row('Ana', ['2022', '2020', '2021'])] })
    expect(links()).toHaveLength(2)
  })

  it('draws no link for a single year', () => {
    render({ data: [row('Ana', ['2021'])] })
    expect(dots()).toHaveLength(1)
    expect(links()).toHaveLength(0)
  })

  it.each([
    ['there are no people', { data: [] }],
    ['there are no years', { allYears: [] }],
  ])('shows the empty text when %s', (_case, props) => {
    render(props)
    expect(container.textContent).toContain('Nobody yet')
    expect(svgs()).toHaveLength(0)
  })

  it('asks the fullscreen view to center it', () => {
    render()
    expect(wrapper.props.centerContent).toBe(true)
  })
})

describe('DumbbellChartCard — axis', () => {
  it('spaces the years evenly from left to right', () => {
    render()
    const xs = Object.values(yearX())
    const steps = xs.slice(1).map((value, index) => value - xs[index])
    expect(steps[0]).toBeGreaterThan(0)
    steps.forEach((step) => expect(step).toBeCloseTo(steps[0]))
  })

  it('keeps the first and last year inside the plot', () => {
    render()
    const xs = Object.values(yearX())
    expect(xs[0]).toBeGreaterThan(0)
    expect(xs.at(-1)).toBeLessThan(num(svgs()[2], 'width'))
  })

  it('centers a single year', () => {
    render({ allYears: ['2021'], data: [row('Ana', ['2021'])] })
    const x = yearX()['2021']
    const width = num(svgs()[2], 'width')
    expect(x).toBeGreaterThan(width * 0.4)
    expect(x).toBeLessThan(width * 0.6)
    expect(num(dots()[0], 'cx')).toBe(x)
  })

  it('stretches with the available width', () => {
    render()
    const before = yearX()['2023']
    resizeTo(600)
    expect(yearX()['2023']).toBe(before + 300)
  })

  it('keeps a minimum column width so many years scroll sideways', () => {
    const allYears = Array.from({ length: 20 }, (_, i) => String(2005 + i))
    render({ allYears, data: [row('Ana', ['2005', '2024'])] })
    const width = num(svgs()[2], 'width')
    expect(width).toBeGreaterThanOrEqual(20 * 36)
    resizeTo(100)
    expect(num(svgs()[2], 'width')).toBe(width)
  })
})

describe('DumbbellChartCard — sizing', () => {
  const people = (count) => Array.from({ length: count }, (_, i) => row(`P${i}`, ['2021']))
  const heightFor = (count) => {
    render({ data: people(count) })
    const height = parseFloat(scroller().style.maxHeight)
    act(() => root.unmount())
    container.remove()
    return height
  }

  it('grows with the rows up to twelve, then scrolls inside the card', () => {
    const two = heightFor(2)
    const twelve = heightFor(12)
    expect(twelve - two).toBe(10 * 36)
    render({ data: people(30) })
    expect(parseFloat(scroller().style.maxHeight)).toBe(twelve)
  })

  it('shows every row in fullscreen', () => {
    render({}, { fullscreen: true })
    expect(scroller().style.maxHeight).toBe('')
  })

  it('starts at the most recent years when the chart overflows', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(900)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
    render()
    expect(scroller().scrollLeft).toBe(900)
    scroller().scrollLeft = 120
    resizeTo(280)
    expect(scroller().scrollLeft).toBe(120)
  })

  it('does not scroll when everything fits', () => {
    render()
    expect(scroller().scrollLeft).toBe(0)
  })

  it('stops observing its size when removed', () => {
    render()
    const [observer] = observers
    act(() => root.unmount())
    root = null
    expect(observer.disconnect).toHaveBeenCalled()
  })
})
