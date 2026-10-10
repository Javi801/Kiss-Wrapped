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
