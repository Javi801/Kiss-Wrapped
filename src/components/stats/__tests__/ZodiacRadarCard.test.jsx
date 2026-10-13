// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

// What the mocked chart received, and the hover state fed to its tooltip.
const chart = vi.hoisted(() => ({ data: null, hover: null }))
// The props the mocked fullscreen wrapper received last.
const wrapper = vi.hoisted(() => ({ props: null }))

vi.mock('@/lib/theme', () => ({
  usePalette: () => ({ storyBgFrom: '#111111', storyBgTo: '#222222' }),
}))
vi.mock('@/components/charts/FullscreenChartWrapper', () => ({
  default: (props) => {
    wrapper.props = props
    return props.children
  },
}))
vi.mock('recharts', async () => {
  const { createElement, cloneElement } = await import('react')
  return {
    ResponsiveContainer: ({ children }) => children,
    RadarChart: ({ data, children }) => {
      chart.data = data
      return createElement('div', { 'data-chart': true }, children)
    },
    Tooltip: ({ content }) => (chart.hover ? cloneElement(content, chart.hover) : null),
    Radar: () => null,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    PolarRadiusAxis: () => null,
  }
})

import ZodiacRadarCard from '@/components/stats/ZodiacRadarCard'
import ZodiacOrbitStory from '@/components/stats/ZodiacOrbitStory'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en
const orbit = {
  signs: [
    { glyph: '♈', label: 'Aries', value: 2 },
    { glyph: '♌', label: 'Leo', value: 0 },
  ],
  topSigns: [{ glyph: '♈', label: 'Aries' }],
}
const persons = [
  { label: 'Aries', value: 2 },
  { label: 'Leo', value: 0 },
]
const events = [
  { label: 'Aries', value: 7 },
  { label: 'Leo', value: 1 },
]
const empty = [
  { label: 'Aries', value: 0 },
  { label: 'Leo', value: 0 },
]

let container
let root

function render(props = {}) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <ZodiacRadarCard
        personsByZodiac={persons}
        eventsByZodiac={events}
        zodiacOrbit={orbit}
        emptyText="No signs yet"
        t={t}
        {...props}
      />
    )
  })
}

const buttons = () => [...container.querySelectorAll('button')]
const showEvents = () => act(() => buttons()[1].click())
const tooltip = () => container.querySelector('[data-chart]').textContent

beforeEach(() => {
  chart.data = null
  chart.hover = null
  wrapper.props = null
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('ZodiacRadarCard', () => {
  it('starts with people per sign', () => {
    render()
    expect(container.textContent).toContain(t.personsByZodiac)
    expect(container.textContent).toContain(t.zodiacDistribution)
    expect(chart.data).toBe(persons)
  })

  it('switches to events per sign and back', () => {
    render()
    showEvents()
    expect(container.textContent).toContain(t.eventsByZodiac)
    expect(container.textContent).toContain(t.groupedBySign)
    expect(chart.data).toBe(events)

    act(() => buttons()[0].click())
    expect(chart.data).toBe(persons)
  })

  it('labels the modes, capitalizing the events one', () => {
    render({ t: { ...t, chartEvents: 'events' } })
    expect(buttons().map((button) => button.textContent)).toEqual([t.peopleStats, 'Events'])
  })

  it('shows the empty text when every sign is at zero', () => {
    render({ personsByZodiac: empty })
    expect(container.textContent).toContain('No signs yet')
    expect(container.querySelector('[data-chart]')).toBeNull()
  })

  it('decides emptiness per mode', () => {
    render({ personsByZodiac: empty })
    showEvents()
    expect(container.querySelector('[data-chart]')).not.toBeNull()
    expect(container.textContent).not.toContain('No signs yet')
  })

  it('shows the empty text without any signs', () => {
    render({ personsByZodiac: [] })
    expect(container.textContent).toContain('No signs yet')
  })
})

describe('ZodiacRadarCard — expanded view', () => {
  it('expands into the zodiac orbit story in the people mode', () => {
    render()
    const { expandedView } = wrapper.props
    expect(expandedView.type).toBe(ZodiacOrbitStory)
    expect(expandedView.props).toEqual({ ...orbit, t })
  })

  it('expands the card itself in the events mode', () => {
    render()
    showEvents()
    expect(wrapper.props.expandedView).toBeUndefined()

    act(() => buttons()[0].click())
    expect(wrapper.props.expandedView.type).toBe(ZodiacOrbitStory)
  })

  it('expands the card itself without people', () => {
    render({ personsByZodiac: empty })
    expect(wrapper.props.expandedView).toBeUndefined()
  })

  it('surrounds the story with the story background of the palette', () => {
    render()
    expect(wrapper.props.expandedBackground).toBe(
      'linear-gradient(to bottom right, #111111, #222222)'
    )
  })
})

describe('ZodiacRadarCard — tooltip', () => {
  const hover = (label, value) => ({ active: true, payload: [{ value, payload: { label } }] })

  it('names the sign and counts people', () => {
    chart.hover = hover('Aries', 2)
    render()
    expect(tooltip()).toBe(`Aries2 ${t.chartPersons}`)
  })

  it('uses the singular for one', () => {
    chart.hover = hover('Aries', 1)
    render()
    expect(tooltip()).toBe(`Aries1 ${t.chartPerson}`)
  })

  it('counts events in the events mode', () => {
    chart.hover = hover('Aries', 7)
    render()
    showEvents()
    expect(tooltip()).toBe(`Aries7 ${t.chartEvents}`)
  })

  it('uses the singular for one event', () => {
    chart.hover = hover('Leo', 1)
    render()
    showEvents()
    expect(tooltip()).toBe(`Leo1 ${t.chartEvent}`)
  })

  it.each([
    ['inactive', { active: false, payload: [{ value: 2, payload: { label: 'Aries' } }] }],
    ['without a payload', { active: true, payload: [] }],
    ['with a missing payload', { active: true }],
  ])('is hidden while %s', (_case, state) => {
    chart.hover = state
    render()
    expect(tooltip()).toBe('')
  })
})
