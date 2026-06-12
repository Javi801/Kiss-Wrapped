import { describe, it, expect, vi } from 'vitest'
import { COPY } from '@/lib/constants'
import { getFirstEventDate, getLastEventDate, getStatsData } from '@/lib/stats'

const t = COPY.en

const makePerson = (name, events = [], extra = {}) => ({
  id: name.toLowerCase(),
  name,
  age: 25,
  gender: 'female',
  zodiacSign: '♒ Aquarius (January 20 - February 19)',
  activity: 'works',
  howWeMet: 'app',
  events,
  ...extra,
})

const makeEvent = (date, score = null, details = 'test detail') => ({
  id: `${date}-${score}`,
  date,
  score,
  details,
})

describe('getFirstEventDate', () => {
  it('returns null for a person with no events', () => {
    expect(getFirstEventDate(makePerson('Ana'))).toBeNull()
  })
  it('returns null when events is undefined', () => {
    expect(getFirstEventDate({ name: 'Ana' })).toBeNull()
  })
  it('returns the only event date when there is one', () => {
    const p = makePerson('Ana', [makeEvent('2024.03.15')])
    expect(getFirstEventDate(p)).toBe('2024.03.15')
  })
  it('returns the earliest date among multiple events', () => {
    const p = makePerson('Ana', [
      makeEvent('2024.06.01'),
      makeEvent('2023.01.15'),
      makeEvent('2024.01.01'),
    ])
    expect(getFirstEventDate(p)).toBe('2023.01.15')
  })
  it('returns null when sorted events do not contain a date', () => {
    expect(getFirstEventDate(makePerson('Ana', [{}]))).toBeNull()
  })
  it('does not mutate the original events array', () => {
    const events = [makeEvent('2024.06.01'), makeEvent('2023.01.15')]
    const p = makePerson('Ana', events)
    getFirstEventDate(p)
    expect(p.events[0].date).toBe('2024.06.01')
  })
})

describe('getLastEventDate', () => {
  it('returns null for a person with no events', () => {
    expect(getLastEventDate(makePerson('Ana'))).toBeNull()
  })
  it('returns null when events is undefined', () => {
    expect(getLastEventDate({ name: 'Ana' })).toBeNull()
  })
  it('returns the only event date when there is one', () => {
    const p = makePerson('Ana', [makeEvent('2024.03.15')])
    expect(getLastEventDate(p)).toBe('2024.03.15')
  })
  it('returns the latest date among multiple events', () => {
    const p = makePerson('Ana', [
      makeEvent('2024.06.01'),
      makeEvent('2023.01.15'),
      makeEvent('2025.12.31'),
    ])
    expect(getLastEventDate(p)).toBe('2025.12.31')
  })
  it('returns null when sorted events do not contain a date', () => {
    expect(getLastEventDate(makePerson('Ana', [{}]))).toBeNull()
  })
  it('does not mutate the original events array', () => {
    const events = [makeEvent('2024.06.01'), makeEvent('2025.12.31')]
    const p = makePerson('Ana', events)
    getLastEventDate(p)
    expect(p.events[0].date).toBe('2024.06.01')
  })
})

describe('getStatsData', () => {
  it('returns zero-state for an empty people array', () => {
    const stats = getStatsData([], t)
    expect(stats.allEvents).toHaveLength(0)
    expect(stats.averageEventsPerPerson).toBe('0.0')
    expect(stats.mostActivePerson).toBe('—')
    expect(stats.averageScore).toBe('0.0')
    expect(stats.mostActiveCount).toBe(0)
  })

  it('counts all events across all people', () => {
    const people = [
      makePerson('Ana', [makeEvent('2024.01.01'), makeEvent('2024.02.01')]),
      makePerson('Bob', [makeEvent('2024.03.01')]),
    ]
    expect(getStatsData(people, t).allEvents).toHaveLength(3)
  })

  it('handles people without an events array', () => {
    const stats = getStatsData([{ name: 'Ana', gender: 'female', activity: 'works' }], t)
    expect(stats.allEvents).toHaveLength(0)
    expect(stats.peopleMostEvents).toEqual([{ label: 'Ana', value: 0 }])
  })

  it('calculates average events per person', () => {
    const people = [
      makePerson('Ana', [makeEvent('2024.01.01'), makeEvent('2024.02.01')]),
      makePerson('Bob', [makeEvent('2024.03.01')]),
    ]
    // 3 events / 2 people = 1.5
    expect(getStatsData(people, t).averageEventsPerPerson).toBe('1.5')
  })

  it('identifies the most active person by event count', () => {
    const people = [
      makePerson('Ana', [makeEvent('2024.01.01')]),
      makePerson('Bob', [
        makeEvent('2024.01.01'),
        makeEvent('2024.02.01'),
        makeEvent('2024.03.01'),
      ]),
    ]
    const stats = getStatsData(people, t)
    expect(stats.mostActivePerson).toBe('Bob')
    expect(stats.mostActiveCount).toBe(3)
  })

  it('calculates average score ignoring unscored events', () => {
    const people = [
      makePerson('Ana', [
        makeEvent('2024.01.01', 4),
        makeEvent('2024.02.01', null),
        makeEvent('2024.03.01', 2),
      ]),
    ]
    // (4 + 2) / 2 scored events = 3.0
    expect(getStatsData(people, t).averageScore).toBe('3.0')
  })

  it('reports "0.0" average score when no events are scored', () => {
    const people = [makePerson('Ana', [makeEvent('2024.01.01', null)])]
    expect(getStatsData(people, t).averageScore).toBe('0.0')
  })

  it('groups events by month in chronological order', () => {
    const people = [
      makePerson('Ana', [
        makeEvent('2024.03.01'),
        makeEvent('2024.01.15'),
        makeEvent('2024.03.20'),
      ]),
    ]
    expect(getStatsData(people, t).eventsPerMonth).toEqual([
      { label: '2024-01', value: 1 },
      { label: '2024-03', value: 2 },
    ])
  })

  it('skips invalid dates when grouping events by month', () => {
    const people = [makePerson('Ana', [makeEvent('bad-date'), makeEvent('2024.03.20')])]
    expect(getStatsData(people, t).eventsPerMonth).toEqual([{ label: '2024-03', value: 1 }])
  })

  it('groups events by year in chronological order', () => {
    const people = [
      makePerson('Ana', [
        makeEvent('2024.01.01'),
        makeEvent('2023.06.15'),
        makeEvent('2024.03.01'),
      ]),
    ]
    expect(getStatsData(people, t).eventsPerYear).toEqual([
      { label: '2023', value: 1 },
      { label: '2024', value: 2 },
    ])
  })

  it('skips invalid dates when grouping events by year', () => {
    const people = [makePerson('Ana', [makeEvent('2024.01.01'), makeEvent('not-a-date')])]
    expect(getStatsData(people, t).eventsPerYear).toEqual([{ label: '2024', value: 1 }])
  })

  it('identifies people whose events span two or more years', () => {
    const people = [
      makePerson('Ana', [makeEvent('2023.01.01'), makeEvent('2024.01.01')]),
      makePerson('Bob', [makeEvent('2024.01.01')]),
    ]
    const multiYear = getStatsData(people, t).personsWithEventsInMultipleYears
    expect(multiYear).toHaveLength(1)
    expect(multiYear[0].label).toBe('Ana')
  })

  it('counts scored vs unscored events correctly', () => {
    const people = [
      makePerson('Ana', [
        makeEvent('2024.01.01', 3),
        makeEvent('2024.02.01', null),
        makeEvent('2024.03.01', 1),
      ]),
    ]
    const { scoredVsUnscored } = getStatsData(people, t)
    expect(scoredVsUnscored.find((d) => d.label === t.scores).value).toBe(2)
    expect(scoredVsUnscored.find((d) => d.label === t.noScore).value).toBe(1)
  })

  it('groups people by gender count', () => {
    const people = [
      makePerson('Ana', [], { gender: 'female' }),
      makePerson('Bob', [], { gender: 'male' }),
      makePerson('Sam', [], { gender: 'female' }),
    ]
    const { personsByGender } = getStatsData(people, t)
    expect(personsByGender.find((d) => d.label === t.female).value).toBe(2)
    expect(personsByGender.find((d) => d.label === t.male).value).toBe(1)
  })

  it('groups events by gender count', () => {
    const people = [
      makePerson('Ana', [makeEvent('2024.01.01'), makeEvent('2024.02.01')], {
        gender: 'female',
      }),
      makePerson('Bob', [makeEvent('2024.01.01')], { gender: 'male' }),
    ]
    const { eventsByGender } = getStatsData(people, t)
    expect(eventsByGender.find((d) => d.label === t.female).value).toBe(2)
    expect(eventsByGender.find((d) => d.label === t.male).value).toBe(1)
  })

  it('limits peopleMostEvents to 8 entries', () => {
    const people = Array.from({ length: 12 }, (_, i) =>
      makePerson(`Person${i}`, [makeEvent('2024.01.01')])
    )
    expect(getStatsData(people, t).peopleMostEvents).toHaveLength(8)
  })

  it('groups people by first letter alphabetically', () => {
    const people = [makePerson('Alice'), makePerson('Anna'), makePerson('Bob')]
    const { personsByFirstLetter } = getStatsData(people, t)
    expect(personsByFirstLetter.find((d) => d.label === 'A').value).toBe(2)
    expect(personsByFirstLetter.find((d) => d.label === 'B').value).toBe(1)
  })

  it('groups people without a name under #', () => {
    const { personsByFirstLetter } = getStatsData([makePerson('')], t)
    expect(personsByFirstLetter).toEqual([{ label: '#', value: 1 }])
  })

  it('groups people by age using birthYear + zodiac calculation', () => {
    // Aquarius ends Feb 19; mocked date March 15 → end already passed → age = year - birthYear
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00'))
    const AQUARIUS = '♒ Aquarius (January 20 - February 19)'
    const people = [
      makePerson('Ana', [], { birthYear: 2001, zodiacSign: AQUARIUS }), // 2026-2001 = 25
      makePerson('Bob', [], { birthYear: 1996, zodiacSign: AQUARIUS }), // 2026-1996 = 30
      makePerson('Sam', [], { birthYear: 2001, zodiacSign: AQUARIUS }), // 25
    ]
    const { personsByAge } = getStatsData(people, t)
    expect(personsByAge.find((d) => d.label === '25').value).toBe(2)
    expect(personsByAge.find((d) => d.label === '30').value).toBe(1)
    vi.useRealTimers()
  })

  it('groups people by age falling back to stored age for legacy records', () => {
    const people = [
      makePerson('Ana', [], { age: 25 }),
      makePerson('Bob', [], { age: 30 }),
      makePerson('Sam', [], { age: 25 }),
    ]
    const { personsByAge } = getStatsData(people, t)
    expect(personsByAge.find((d) => d.label === '25').value).toBe(2)
    expect(personsByAge.find((d) => d.label === '30').value).toBe(1)
  })

  it('excludes persons with no resolvable age from personsByAge', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00'))
    const AQUARIUS = '♒ Aquarius (January 20 - February 19)'
    const people = [
      makePerson('WithAge', [], { birthYear: 2001, zodiacSign: AQUARIUS }), // → 25
      makePerson('NoAge', [], { age: undefined, zodiacSign: null }), // → skipped
    ]
    const { personsByAge } = getStatsData(people, t)
    expect(personsByAge.find((d) => d.label === 'undefined')).toBeUndefined()
    expect(personsByAge).toHaveLength(1)
    expect(personsByAge[0].label).toBe('25')
    vi.useRealTimers()
  })

  it('sums events by zodiac sign', () => {
    const people = [
      makePerson('Ana', [makeEvent('2024.01.01'), makeEvent('2024.02.01')], {
        zodiacSign: '♒ Aquarius (January 20 - February 19)',
      }),
      makePerson('Bob', [makeEvent('2024.01.01')], {
        zodiacSign: '♒ Aquarius (January 20 - February 19)',
      }),
    ]
    const { eventsByZodiac } = getStatsData(people, t)
    expect(eventsByZodiac.find((d) => d.label === 'Aquarius').value).toBe(3)
  })

  it('groups people by event count bucket', () => {
    const people = [
      makePerson('Ana', [makeEvent('2024.01.01'), makeEvent('2024.02.01')]),
      makePerson('Bob', [makeEvent('2024.01.01'), makeEvent('2024.03.01')]),
      makePerson('Sam', [makeEvent('2024.01.01')]),
    ]
    const { numberOfEventsByNumberOfPersons } = getStatsData(people, t)
    expect(numberOfEventsByNumberOfPersons.find((d) => d.label === '2').value).toBe(2)
    expect(numberOfEventsByNumberOfPersons.find((d) => d.label === '1').value).toBe(1)
  })

  it('sorts personsWithEventsInMultipleYears by count desc, then alphabetically on tie', () => {
    const people = [
      makePerson('Zoe', [makeEvent('2023.01.01'), makeEvent('2024.01.01')]),
      makePerson('Ana', [makeEvent('2023.01.01'), makeEvent('2024.01.01')]),
      makePerson('Bob', [
        makeEvent('2022.01.01'),
        makeEvent('2023.01.01'),
        makeEvent('2024.01.01'),
      ]),
    ]
    const result = getStatsData(people, t).personsWithEventsInMultipleYears
    expect(result[0].label).toBe('Bob')
    expect(result[1].label).toBe('Ana')
    expect(result[2].label).toBe('Zoe')
  })

  it('merges events when the same zodiac sign is stored in different languages', () => {
    const people = [
      makePerson('Ana', [makeEvent('2024.01.01'), makeEvent('2024.02.01')], {
        zodiacSign: '♒ Aquarius (January 20 - February 19)',
      }),
      makePerson('Bob', [makeEvent('2024.01.01')], {
        zodiacSign: '♒ Acuario (20 enero - 19 febrero)',
      }),
    ]
    const { eventsByZodiac } = getStatsData(people, t)
    expect(eventsByZodiac.find((d) => d.label === 'Aquarius').value).toBe(3)
    expect(eventsByZodiac.find((d) => d.label === 'Acuario')).toBeUndefined()
  })

  it('sorts eventsByZodiac by event count descending', () => {
    const people = [
      makePerson('Ana', [makeEvent('2024.01.01'), makeEvent('2024.02.01')], {
        zodiacSign: '♒ Aquarius (January 20 - February 19)',
      }),
      makePerson('Bob', [makeEvent('2024.01.01')], {
        zodiacSign: '♓ Pisces (February 20 - March 20)',
      }),
    ]
    const { eventsByZodiac } = getStatsData(people, t)
    expect(eventsByZodiac[0].label).toBe('Aquarius')
    expect(eventsByZodiac[1].label).toBe('Pisces')
  })

  it('sorts eventsByActivity by event count descending', () => {
    const people = [
      makePerson('Ana', [makeEvent('2024.01.01'), makeEvent('2024.02.01')], {
        activity: 'works',
      }),
      makePerson('Bob', [makeEvent('2024.01.01')], {
        activity: 'studies',
      }),
    ]
    const { eventsByActivity } = getStatsData(people, t)
    expect(eventsByActivity[0]).toEqual({ label: t.works, value: 2 })
    expect(eventsByActivity[1]).toEqual({ label: t.studies, value: 1 })
  })

  it('counts events per score in scoresByKisses', () => {
    const people = [
      makePerson('Ana', [
        makeEvent('2024.01.01', 3),
        makeEvent('2024.02.01', 3),
        makeEvent('2024.03.01', 1),
        makeEvent('2024.04.01', null),
      ]),
    ]
    const { scoresByKisses } = getStatsData(people, t)
    const three = scoresByKisses.find((d) => d.label === '💋💋💋')
    const one = scoresByKisses.find((d) => d.label === '💋')
    expect(three?.value).toBe(2)
    expect(one?.value).toBe(1)
  })

  it('scoresByKisses pre-seeds all SCORE_OPTIONS with 0 when no events are scored', () => {
    const people = [makePerson('Ana', [makeEvent('2024.01.01', null)])]
    const { scoresByKisses } = getStatsData(people, t)
    expect(scoresByKisses.length).toBe(6) // 0–5
    expect(scoresByKisses.every((d) => d.value === 0)).toBe(true)
  })

  it('counts events without place or situation in total eventCount', () => {
    const people = [
      makePerson('Ana', [
        { id: 'e1', date: '2024.01.01', score: null },
        { id: 'e2', date: '2024.02.01', score: null },
      ]),
    ]
    const { allEvents } = getStatsData(people, t)
    expect(allEvents).toHaveLength(2)
  })

  it('includes events without situation in eventsByZodiac count', () => {
    const people = [
      makePerson(
        'Ana',
        [
          { id: 'e1', date: '2024.01.01' },
          { id: 'e2', date: '2024.02.01' },
        ],
        { zodiacSign: '♒ Aquarius (January 20 - February 19)' }
      ),
    ]
    const { eventsByZodiac } = getStatsData(people, t)
    const aquarius = eventsByZodiac.find((d) => d.label === 'Aquarius')
    expect(aquarius.value).toBe(2)
  })

  it('includes events without place in eventsByActivity count', () => {
    const people = [
      makePerson(
        'Ana',
        [
          { id: 'e1', date: '2024.01.01' },
          { id: 'e2', date: '2024.02.01' },
        ],
        { activity: 'works' }
      ),
    ]
    const { eventsByActivity } = getStatsData(people, t)
    const works = eventsByActivity.find((d) => d.label === t.works)
    expect(works.value).toBe(2)
  })
})
