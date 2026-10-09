import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { COPY, ZODIAC_OPTIONS } from '@/lib/constants'
import { translateActivity, translateGender } from '@/lib/format'
import { excludePartnerEvents } from '@/lib/stats'

// Props handed to each chart card, keyed by card name. Bar cards are keyed by title.
const cards = vi.hoisted(() => ({ current: {} }))

function capture(name) {
  return {
    default: (props) => {
      cards.current[name === 'bar' ? `bar:${props.title}` : name] = props
      return null
    },
  }
}

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/charts/BarChartCard', () => capture('bar'))
vi.mock('@/components/charts/AreaChartCard', () => capture('area'))
vi.mock('@/components/stats/AgeRangeCard', () => capture('ageRange'))
vi.mock('@/components/stats/ActivityDonutCard', () => capture('activity'))
vi.mock('@/components/stats/GenderDonutCard', () => capture('gender'))
vi.mock('@/components/stats/ZodiacRadarCard', () => capture('zodiac'))

import StatsPeopleTab from '@/components/stats/StatsPeopleTab'

const t = COPY.en
const zodiac = (name) => ZODIAC_OPTIONS.en.find((item) => item.includes(name))

// Ana was never a partner, Mia is a partner for every event, and Leo has one event
// inside his past partner period and one outside it.
const people = [
  {
    id: 'ana',
    name: 'Ana',
    gender: 'female',
    activity: 'studies',
    zodiacSign: zodiac('Aquarius'),
    partnerStatus: 'never',
    partnerFrom: '',
    partnerTo: '',
    events: [
      { id: 'a1', date: '2024.01.01' },
      { id: 'a2', date: '2024.02.01' },
    ],
  },
  {
    id: 'mia',
    name: 'Mia',
    gender: 'female',
    activity: 'works',
    zodiacSign: zodiac('Aries'),
    partnerStatus: 'current',
    partnerFrom: '',
    partnerTo: '',
    events: [
      { id: 'm1', date: '2024.01.10' },
      { id: 'm2', date: '2024.02.10' },
      { id: 'm3', date: '2024.03.10' },
    ],
  },
  {
    id: 'leo',
    name: 'Leo',
    gender: 'male',
    activity: 'studies',
    zodiacSign: zodiac('Aquarius'),
    partnerStatus: 'past',
    partnerFrom: '2023.01.01',
    partnerTo: '2023.12.31',
    events: [
      { id: 'l1', date: '2023.06.01' },
      { id: 'l2', date: '2024.06.01' },
    ],
  },
]

const valueOf = (rows, label) => rows.find((row) => row.label === label)?.value

describe('StatsPeopleTab — partner periods', () => {
  beforeEach(() => {
    cards.current = {}
    renderToStaticMarkup(
      <StatsPeopleTab
        people={people}
        eventPeople={excludePartnerEvents(people)}
        t={t}
        language="en"
      />
    )
  })

  it('counts partners in the gender chart but leaves their partner-period events out', () => {
    const { personsByGender, eventsByGender } = cards.current.gender
    const female = translateGender('female', t)
    const male = translateGender('male', t)
    expect(valueOf(personsByGender, female)).toBe(2)
    expect(valueOf(personsByGender, male)).toBe(1)
    expect(valueOf(eventsByGender, female)).toBe(2)
    expect(valueOf(eventsByGender, male)).toBe(1)
  })

  it('counts partners in the activity chart but leaves their partner-period events out', () => {
    const { personsByActivity, eventsByActivity } = cards.current.activity
    const studies = translateActivity('studies', t)
    const works = translateActivity('works', t)
    expect(valueOf(personsByActivity, studies)).toBe(2)
    expect(valueOf(personsByActivity, works)).toBe(1)
    expect(valueOf(eventsByActivity, studies)).toBe(3)
    expect(valueOf(eventsByActivity, works)).toBeUndefined()
  })

  it('counts partners in the zodiac chart but leaves their partner-period events out', () => {
    const { personsByZodiac, eventsByZodiac } = cards.current.zodiac
    expect(valueOf(personsByZodiac, 'Aries')).toBe(1)
    expect(valueOf(personsByZodiac, 'Aquarius')).toBe(2)
    expect(valueOf(eventsByZodiac, 'Aries')).toBe(0)
    expect(valueOf(eventsByZodiac, 'Aquarius')).toBe(3)
  })

  it('keeps partners in the first-letter chart', () => {
    const { data } = cards.current[`bar:${t.personsByFirstLetter}`]
    expect(valueOf(data, 'A')).toBe(1)
    expect(valueOf(data, 'M')).toBe(1)
    expect(valueOf(data, 'L')).toBe(1)
  })

  it('builds the event-count distribution without partner-period events', () => {
    // Ana keeps 2 events, Leo keeps 1 and Mia is dropped (never a zero-event entry).
    expect(cards.current.area.data).toEqual([
      { label: '0', value: 0 },
      { label: '1', value: 1 },
      { label: '2', value: 1 },
    ])
  })

  it('hands the unfiltered people list to the age range card', () => {
    expect(cards.current.ageRange.people).toBe(people)
  })
})
