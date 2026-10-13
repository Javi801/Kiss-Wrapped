// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY, PALETTES } from '@/lib/constants'

// The palette the story reads, swapped per test.
const theme = vi.hoisted(() => ({ palette: null }))

vi.mock('@/lib/theme', () => ({ usePalette: () => theme.palette }))

import ZodiacOrbitStory from '@/components/stats/ZodiacOrbitStory'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

// The 12 signs in story order; 15 people in total.
const signs = [
  { glyph: '♈', label: 'Aries', value: 8 },
  { glyph: '♉', label: 'Taurus', value: 2 },
  { glyph: '♊', label: 'Gemini', value: 0 },
  { glyph: '♋', label: 'Cancer', value: 0 },
  { glyph: '♌', label: 'Leo', value: 5 },
  { glyph: '♍', label: 'Virgo', value: 0 },
  { glyph: '♎', label: 'Libra', value: 0 },
  { glyph: '♏', label: 'Scorpio', value: 0 },
  { glyph: '♐', label: 'Sagittarius', value: 0 },
  { glyph: '♑', label: 'Capricorn', value: 0 },
  { glyph: '♒', label: 'Aquarius', value: 0 },
  { glyph: '♓', label: 'Pisces', value: 0 },
]
const aries = { glyph: '♈', label: 'Aries' }
const leo = { glyph: '♌', label: 'Leo' }
const taurus = { glyph: '♉', label: 'Taurus' }

// Center and radius of the radar, in viewBox units.
const CENTER = { x: 540, y: 1050 }
const RADIUS = 285

let container
let root

function render(props = {}) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<ZodiacOrbitStory signs={signs} topSigns={[aries]} t={t} {...props} />)
  })
}

const svg = () => container.querySelector('svg')
const texts = () => [...svg().querySelectorAll('text')]
const textOf = (content) => texts().find((node) => node.textContent === content)
const signGroups = () => [...svg().querySelectorAll('[data-zodiac-sign]')]
const topSigns = () => svg().querySelector('[data-zodiac-top-signs]')

beforeEach(() => {
  theme.palette = PALETTES.pink
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('ZodiacOrbitStory — canvas', () => {
  it('is a 1080 × 1920 image', () => {
    render()
    expect(svg().getAttribute('width')).toBe('1080')
    expect(svg().getAttribute('height')).toBe('1920')
    expect(svg().getAttribute('viewBox')).toBe('0 0 1080 1920')
    expect(svg().getAttribute('role')).toBe('img')
  })

  it('shows the brand and the story texts', () => {
    render()
    for (const content of [
      'KissWrapped',
      t.zodiacOrbitKicker,
      t.zodiacOrbitTitleTop,
      t.zodiacOrbitTitleBottom,
      t.zodiacOrbitSubtitle,
      t.zodiacOrbitClosingTop,
      t.zodiacOrbitClosingBottom,
    ]) {
      expect(textOf(content)).toBeDefined()
    }
  })

  it('takes its texts from the given copy', () => {
    render({ t: COPY.es })
    expect(textOf(COPY.es.zodiacOrbitKicker)).toBeDefined()
    expect(textOf(COPY.es.zodiacOrbitTitleTop)).toBeDefined()
    expect(textOf(t.zodiacOrbitKicker)).toBeUndefined()
  })
})

describe('ZodiacOrbitStory — signs', () => {
  it('draws the 12 signs in the given order with their glyph and name', () => {
    render()
    expect(signGroups().map((group) => group.dataset.zodiacSign)).toEqual(
      signs.map((sign) => sign.glyph)
    )
    expect(
      signGroups().map((group) => [...group.querySelectorAll('text')].map((n) => n.textContent))
    ).toEqual(signs.map((sign) => [sign.glyph, sign.label]))
  })

  it('points the first axis up and continues clockwise', () => {
    render()
    const axes = signGroups().map((group) => group.querySelector('line'))
    expect(axes[0].getAttribute('x2')).toBe('540.00')
    expect(axes[0].getAttribute('y2')).toBe((CENTER.y - RADIUS).toFixed(2))
    // Three signs later the axis points right, and six later it points down.
    expect(axes[3].getAttribute('x2')).toBe((CENTER.x + RADIUS).toFixed(2))
    expect(axes[6].getAttribute('y2')).toBe((CENTER.y + RADIUS).toFixed(2))
  })

  it('places one point per sign at its value', () => {
    render()
    const points = [...svg().querySelectorAll('circle')]
    expect(points).toHaveLength(12)
    // Aries holds the top of the scale, so it sits on the outer ring.
    expect(points[0].getAttribute('cy')).toBe((CENTER.y - RADIUS).toFixed(2))
    // A sign without people stays at the center.
    expect(points[2].getAttribute('cx')).toBe('540.00')
    expect(points[2].getAttribute('cy')).toBe('1050.00')
    // Leo has 5 of 8 and its axis points down-left.
    const leoX = CENTER.x + Math.cos(-Math.PI / 2 + (4 * 2 * Math.PI) / 12) * RADIUS * (5 / 8)
    expect(points[4].getAttribute('cx')).toBe(leoX.toFixed(2))
  })

  it('labels the four rings up to the highest value', () => {
    render()
    for (const label of ['2', '4', '6', '8']) expect(textOf(label)).toBeDefined()
  })

  it('rounds the scale up to a multiple of the ring count', () => {
    render({ signs: signs.map((sign) => ({ ...sign, value: Math.min(sign.value, 5) })) })
    for (const label of ['2', '4', '6', '8']) expect(textOf(label)).toBeDefined()
  })

  it('reads each sign with its value to assistive tech', () => {
    render()
    expect(svg().getAttribute('aria-label')).toBe(
      `${t.zodiacOrbitAriaLabel}: ${signs.map((sign) => `${sign.label} ${sign.value}`).join(', ')}`
    )
  })

  it('does not show the total of people', () => {
    render()
    expect(textOf('15')).toBeUndefined()
    expect(svg().getAttribute('aria-label')).not.toMatch(/\b15\b/)
  })
})

describe('ZodiacOrbitStory — most repeated signs', () => {
  it('names a single sign with the singular text', () => {
    render()
    expect(topSigns().textContent).toBe('♈ Aries')
    expect(topSigns().getAttribute('font-size')).toBe('58')
    expect(textOf(t.zodiacOrbitTopSign)).toBeDefined()
    expect(textOf(t.zodiacOrbitTopSigns)).toBeUndefined()
  })

  it('names tied signs in order with the plural text', () => {
    render({ topSigns: [leo, aries] })
    expect(topSigns().textContent).toBe('♌ Leo  ·  ♈ Aries')
    expect(textOf(t.zodiacOrbitTopSigns)).toBeDefined()
    expect(textOf(t.zodiacOrbitTopSign)).toBeUndefined()
  })

  it('shrinks the text as more signs share the line', () => {
    render({ topSigns: [leo, aries] })
    expect(topSigns().getAttribute('font-size')).toBe('50')
    act(() => root.unmount())
    container.remove()
    render({ topSigns: [leo, aries, taurus] })
    expect(topSigns().textContent).toBe('♌ Leo  ·  ♈ Aries  ·  ♉ Taurus')
    expect(topSigns().getAttribute('font-size')).toBe('40')
  })
})

describe('ZodiacOrbitStory — palette', () => {
  it.each(Object.keys(PALETTES))('uses the story colors of the %s palette', (name) => {
    const P = PALETTES[name]
    theme.palette = P
    render()
    const stops = [...svg().querySelectorAll('#zodiac-orbit-bg stop')]
    expect(stops.map((stop) => stop.getAttribute('stop-color'))).toEqual([
      P.storyBgFrom,
      P.storyBgTo,
    ])
    expect(textOf('KissWrapped').getAttribute('fill')).toBe(P.storyAccent)
    expect(textOf(t.zodiacOrbitKicker).getAttribute('fill')).toBe(P.storyWarm)
    expect(textOf(t.zodiacOrbitTitleTop).getAttribute('fill')).toBe(P.storyText)
    expect(textOf(t.zodiacOrbitSubtitle).getAttribute('fill')).toBe(P.storyTextSoft)
    expect(textOf('Aries').getAttribute('fill')).toBe(P.storyTextMuted)
    expect(topSigns().getAttribute('fill')).toBe(P.storyWarm)
  })
})
