import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { COPY } from '@/lib/constants'

const zodiacProps = vi.hoisted(() => ({ current: null }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/charts/BarChartCard', () => ({ default: () => null }))
vi.mock('@/components/charts/AreaChartCard', () => ({ default: () => null }))
vi.mock('@/components/stats/AgeRangeCard', () => ({ default: () => null }))
vi.mock('@/components/stats/ActivityDonutCard', () => ({ default: () => null }))
vi.mock('@/components/stats/GenderDonutCard', () => ({ default: () => null }))
vi.mock('@/components/stats/ZodiacRadarCard', () => ({
  default: (props) => {
    zodiacProps.current = props
    return null
  },
}))

import StatsPeopleTab from '@/components/stats/StatsPeopleTab'

const people = [
  {
    id: 'ana',
    name: 'Ana',
    zodiacSign: '♒ Aquarius (January 20 - February 19)',
    events: [
      { id: 'e1', date: '2024.01.01' },
      { id: 'e2', date: '2024.02.01' },
    ],
  },
  {
    id: 'bob',
    name: 'Bob',
    zodiacSign: '♒ Acuario (20 enero - 19 febrero)',
    events: [{ id: 'e3', date: '2024.03.01' }],
  },
]

// Collects every { label, value } row handed to the zodiac card, whatever the prop name.
function zodiacRows() {
  return Object.values(zodiacProps.current)
    .filter(Array.isArray)
    .flat()
    .filter((row) => row && typeof row.label === 'string')
}

describe('StatsPeopleTab — zodiac language', () => {
  beforeEach(() => {
    zodiacProps.current = null
  })

  it('labels the zodiac signs in Spanish when language is es', () => {
    renderToStaticMarkup(<StatsPeopleTab people={people} t={COPY.es} language="es" />)
    const labels = zodiacRows().map((row) => row.label)
    expect(labels).toContain('Acuario')
    expect(labels).not.toContain('Aquarius')
  })

  it('labels the zodiac signs in English when language is en', () => {
    renderToStaticMarkup(<StatsPeopleTab people={people} t={COPY.en} language="en" />)
    const labels = zodiacRows().map((row) => row.label)
    expect(labels).toContain('Aquarius')
    expect(labels).not.toContain('Acuario')
  })

  it('takes the language from the prop, not from the dictionary', () => {
    renderToStaticMarkup(<StatsPeopleTab people={people} t={COPY.en} language="es" />)
    const labels = zodiacRows().map((row) => row.label)
    expect(labels).toContain('Acuario')
    expect(labels).not.toContain('Aquarius')
  })

  it('merges signs stored in different languages into one row per dataset', () => {
    renderToStaticMarkup(<StatsPeopleTab people={people} t={COPY.es} language="es" />)
    const values = zodiacRows()
      .filter((row) => row.label === 'Acuario')
      .map((row) => row.value)
      .sort()
    expect(values).toEqual([2, 3])
  })
})

describe('StatsPeopleTab — zodiac orbit', () => {
  const aries = {
    id: 'cam',
    name: 'Cam',
    zodiacSign: '♈ Aries (March 21 - April 19)',
    events: [
      { id: 'e4', date: '2024.01.01' },
      { id: 'e5', date: '2024.02.01' },
    ],
  }
  const leo = {
    id: 'dan',
    name: 'Dan',
    zodiacSign: '♌ Leo (July 23 - August 23)',
    events: [{ id: 'e6', date: '2024.03.01' }],
  }

  beforeEach(() => {
    zodiacProps.current = null
  })

  it('hands the card the 12 signs starting at Aries with their people', () => {
    renderToStaticMarkup(<StatsPeopleTab people={people} t={COPY.en} language="en" />)
    const { signs } = zodiacProps.current.zodiacOrbit
    expect(signs).toHaveLength(12)
    expect(signs[0]).toEqual({ glyph: '♈', label: 'Aries', value: 0 })
    expect(signs.at(-1).glyph).toBe('♓')
    expect(signs.find((sign) => sign.glyph === '♒')).toEqual({
      glyph: '♒',
      label: 'Aquarius',
      value: 2,
    })
  })

  it('hands the card the most repeated sign in the given language', () => {
    renderToStaticMarkup(<StatsPeopleTab people={people} t={COPY.en} language="es" />)
    expect(zodiacProps.current.zodiacOrbit.topSigns).toEqual([{ glyph: '♒', label: 'Acuario' }])
  })

  it('has no most repeated sign without people', () => {
    renderToStaticMarkup(<StatsPeopleTab people={[]} t={COPY.en} language="en" />)
    const { signs, topSigns } = zodiacProps.current.zodiacOrbit
    expect(signs.every((sign) => sign.value === 0)).toBe(true)
    expect(topSigns).toEqual([])
  })

  it('breaks ties with the events of eventPeople only', () => {
    renderToStaticMarkup(<StatsPeopleTab people={[aries, leo]} t={COPY.en} language="en" />)
    expect(zodiacProps.current.zodiacOrbit.topSigns.map((sign) => sign.label)).toEqual([
      'Aries',
      'Leo',
    ])

    renderToStaticMarkup(
      <StatsPeopleTab people={[aries, leo]} eventPeople={[leo]} t={COPY.en} language="en" />
    )
    expect(zodiacProps.current.zodiacOrbit.topSigns.map((sign) => sign.label)).toEqual([
      'Leo',
      'Aries',
    ])
  })
})
