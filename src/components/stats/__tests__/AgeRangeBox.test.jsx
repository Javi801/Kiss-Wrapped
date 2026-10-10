import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/charts/FullscreenChartWrapper', () => ({
  default: ({ children }) => children,
}))

import AgeRangeBox from '@/components/stats/AgeRangeBox'

// `age` is the legacy static field, so ages don't depend on today's date.
const aged = (...ages) => ages.map((age, index) => ({ id: `p${index}`, age }))

const render = (people, props = {}) =>
  renderToStaticMarkup(
    <AgeRangeBox title="Ages" people={people} emptyText="No ages yet" bare {...props} />
  )

const percents = (html, property) =>
  [...html.matchAll(new RegExp(`${property}:([\\d.]+)%`, 'g'))].map((match) => Number(match[1]))
const ticks = (html) => [...html.matchAll(/<span[^>]*>(\d+)<\/span>/g)].map((m) => Number(m[1]))

// Left offsets in render order: axis line, min whisker, max whisker, box, median, then the ticks.
function plot(html) {
  const [, min, max, boxLeft, median] = percents(html, 'left')
  const [boxWidth] = percents(html, 'width')
  return { min, max, boxLeft, boxWidth, median }
}

describe('AgeRangeBox — boxplot', () => {
  it('spans the whiskers from the youngest to the oldest', () => {
    const html = render(aged(40, 20, 30))
    expect(plot(html)).toMatchObject({ min: 3, max: 97 })
  })

  it('draws the box between the quartiles with the median inside', () => {
    const html = render(aged(20, 30, 40))
    expect(plot(html)).toEqual({ min: 3, max: 97, boxLeft: 26.5, boxWidth: 47, median: 50 })
  })

  it('interpolates the median of an even number of ages', () => {
    expect(plot(render(aged(20, 30))).median).toBe(50)
    expect(plot(render(aged(20, 20, 20, 40))).median).toBe(3)
  })

  it('centers everything when everyone has the same age', () => {
    const html = render(aged(30, 30, 30))
    expect(plot(html)).toEqual({ min: 50, max: 50, boxLeft: 50, boxWidth: 0.5, median: 50 })
    expect(ticks(html)).toEqual([30])
  })

  it('handles a single person', () => {
    const html = render(aged(27))
    expect(plot(html).median).toBe(50)
    expect(ticks(html)).toEqual([27])
  })

  it('keeps a visible box when the quartiles coincide', () => {
    expect(plot(render(aged(20, 20, 20, 20, 40))).boxWidth).toBe(0.5)
  })

  it('ignores people without a usable age', () => {
    const people = [...aged(20, 40), { id: 'x' }, { id: 'y', age: null }, { id: 'z', age: NaN }]
    expect(ticks(render(people))).toEqual([20, 25, 30, 35, 40])
  })
})

describe('AgeRangeBox — axis', () => {
  it('labels five evenly spaced ages from the youngest to the oldest', () => {
    expect(ticks(render(aged(20, 40)))).toEqual([20, 25, 30, 35, 40])
  })

  it('uses one label per year for a narrow range', () => {
    expect(ticks(render(aged(20, 22)))).toEqual([20, 21, 22])
    expect(ticks(render(aged(20, 21)))).toEqual([20, 21])
  })

  it('never repeats a label', () => {
    const labels = ticks(render(aged(20, 25)))
    expect(new Set(labels).size).toBe(labels.length)
    expect(labels[0]).toBe(20)
    expect(labels.at(-1)).toBe(25)
  })
})

describe('AgeRangeBox — empty and framing', () => {
  it('shows only the empty text when bare', () => {
    const html = render([])
    expect(html).toContain('No ages yet')
    expect(html).not.toContain('Ages')
  })

  it('shows the empty text inside a titled card otherwise', () => {
    const html = render([], { bare: false, subtitle: 'All years' })
    expect(html).toContain('Ages')
    expect(html).toContain('All years')
    expect(html).toContain('No ages yet')
  })

  it('omits the chart frame when bare', () => {
    expect(render(aged(20, 40))).not.toContain('Ages')
  })

  it('describes the age range when no subtitle is given', () => {
    const html = render(aged(20, 40), { bare: false })
    expect(html).toContain('Ages')
    expect(html).toContain('20 - 40')
  })

  it('prefers the given subtitle', () => {
    const html = render(aged(20, 40), { bare: false, subtitle: 'All years' })
    expect(html).toContain('All years')
    expect(html).not.toContain('20 - 40')
  })
})
