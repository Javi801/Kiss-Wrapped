import { describe, it, expect } from 'vitest'
import {
  uid,
  createPerson,
  normalizePeople,
  hexToRgb,
  mergeEventTagsFromPeople,
  mergePeopleFieldTags,
  countTagUses,
  TAG_FIELDS,
  tagFieldValues,
  clearTagFromPeople,
} from '@/lib/helpers'
import { todayString } from '@/lib/date'

describe('uid', () => {
  it('returns a non-empty alphanumeric string', () => {
    expect(uid()).toMatch(/^[a-z0-9]+$/)
  })
  it('returns a different value on each call', () => {
    expect(uid()).not.toBe(uid())
  })
  it('generates 1000 unique values with no collisions', () => {
    const ids = Array.from({ length: 1000 }, uid)
    expect(new Set(ids).size).toBe(1000)
  })
})

describe('hexToRgb', () => {
  it('converts #ffffff to white', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
  })
  it('converts #000000 to black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
  })
  it('converts a mixed hex color correctly', () => {
    expect(hexToRgb('#e27396')).toEqual({ r: 226, g: 115, b: 150 })
  })
  it('accepts hex without # prefix', () => {
    expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 })
  })
  it('accepts uppercase hex', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
  })
})

describe('mergeEventTagsFromPeople', () => {
  const person = (values, field = 'situation') => ({
    events: values.map((v) => ({ [field]: v })),
  })

  it('returns existing tags unchanged when people have no events', () => {
    expect(mergeEventTagsFromPeople([], ['Party'], 'situation')).toEqual(['Party'])
  })

  it('appends new values found in events for the given field', () => {
    expect(mergeEventTagsFromPeople([person(['Date'])], [], 'situation')).toEqual(['Date'])
  })

  it('works for a different field (place)', () => {
    expect(mergeEventTagsFromPeople([person(['Café'], 'place')], [], 'place')).toEqual(['Café'])
  })

  it('preserves existing tags at the front', () => {
    const result = mergeEventTagsFromPeople([person(['Trip'])], ['Party'], 'situation')
    expect(result).toEqual(['Party', 'Trip'])
  })

  it('skips values that already exist in tags (case-insensitive)', () => {
    expect(mergeEventTagsFromPeople([person(['party'])], ['Party'], 'situation')).toEqual(['Party'])
    expect(mergeEventTagsFromPeople([person(['PARTY'])], ['Party'], 'situation')).toEqual(['Party'])
  })

  it('deduplicates across events (case-insensitive)', () => {
    const result = mergeEventTagsFromPeople([person(['Date', 'date', 'DATE'])], [], 'situation')
    expect(result).toEqual(['Date'])
  })

  it('deduplicates across multiple people', () => {
    const people = [person(['Date']), person(['date'])]
    expect(mergeEventTagsFromPeople(people, [], 'situation')).toEqual(['Date'])
  })

  it('ignores empty and whitespace-only values', () => {
    expect(mergeEventTagsFromPeople([person(['', '  '])], [], 'situation')).toEqual([])
  })

  it('trims whitespace before comparing', () => {
    expect(mergeEventTagsFromPeople([person(['  Date  '])], ['Date'], 'situation')).toEqual([
      'Date',
    ])
  })

  it('preserves the casing of existing tags when a duplicate arrives', () => {
    const result = mergeEventTagsFromPeople([person(['trip'])], ['Trip'], 'situation')
    expect(result[0]).toBe('Trip')
  })

  it('preserves the casing of the first new occurrence', () => {
    const result = mergeEventTagsFromPeople([person(['First Date', 'first date'])], [], 'situation')
    expect(result).toEqual(['First Date'])
  })

  it('handles events without the requested field', () => {
    const people = [{ events: [{ score: 3 }, { situation: undefined }] }]
    expect(mergeEventTagsFromPeople(people, [], 'situation')).toEqual([])
  })

  it('handles people with no events field', () => {
    expect(mergeEventTagsFromPeople([{ name: 'Ana' }], [], 'situation')).toEqual([])
  })

  it('does not mutate the existingTags array', () => {
    const existing = ['Party']
    mergeEventTagsFromPeople([person(['Trip'])], existing, 'situation')
    expect(existing).toEqual(['Party'])
  })
})

describe('normalizePeople', () => {
  it('returns an empty array for null', () => {
    expect(normalizePeople(null)).toEqual([])
  })
  it('returns an empty array for undefined', () => {
    expect(normalizePeople(undefined)).toEqual([])
  })
  it('returns an empty array for a non-array', () => {
    expect(normalizePeople('string')).toEqual([])
  })
  it('preserves valid scores', () => {
    const people = [{ name: 'Ana', events: [{ score: 3 }] }]
    expect(normalizePeople(people)[0].events[0].score).toBe(3)
  })
  it('preserves score 0 as valid', () => {
    const people = [{ name: 'Ana', events: [{ score: 0 }] }]
    expect(normalizePeople(people)[0].events[0].score).toBe(0)
  })
  it('nullifies scores above 5', () => {
    const people = [{ name: 'Ana', events: [{ score: 99 }] }]
    expect(normalizePeople(people)[0].events[0].score).toBeNull()
  })
  it('nullifies negative scores', () => {
    const people = [{ name: 'Ana', events: [{ score: -1 }] }]
    expect(normalizePeople(people)[0].events[0].score).toBeNull()
  })
  it('nullifies float scores', () => {
    const people = [{ name: 'Ana', events: [{ score: 2.5 }] }]
    expect(normalizePeople(people)[0].events[0].score).toBeNull()
  })
  it('normalizes missing realName to empty string', () => {
    const people = [{ name: 'Ana', events: [] }]
    expect(normalizePeople(people)[0].realName).toBe('')
  })
  it('normalizes null realName to empty string', () => {
    const people = [{ name: 'Ana', realName: null, events: [] }]
    expect(normalizePeople(people)[0].realName).toBe('')
  })
  it('preserves a truthy realName unchanged', () => {
    const people = [{ name: 'Ana', realName: 'Ana García', events: [] }]
    expect(normalizePeople(people)[0].realName).toBe('Ana García')
  })
  it('normalizes missing nationality to empty string', () => {
    const people = [{ name: 'Ana', events: [] }]
    expect(normalizePeople(people)[0].nationality).toBe('')
  })
  it('normalizes null nationality to empty string', () => {
    const people = [{ name: 'Ana', nationality: null, events: [] }]
    expect(normalizePeople(people)[0].nationality).toBe('')
  })
  it('preserves a truthy nationality unchanged', () => {
    const people = [{ name: 'Ana', nationality: 'Chilean', events: [] }]
    expect(normalizePeople(people)[0].nationality).toBe('Chilean')
  })
  it('defaults missing partner fields to never', () => {
    const result = normalizePeople([{ name: 'Ana', events: [] }])[0]
    expect(result.partnerStatus).toBe('never')
    expect(result.partnerFrom).toBe('')
    expect(result.partnerTo).toBe('')
  })
  it('normalizes an invalid partnerStatus to never', () => {
    const people = [{ name: 'Ana', partnerStatus: 'maybe', events: [] }]
    expect(normalizePeople(people)[0].partnerStatus).toBe('never')
  })
  it('migrates legacy isPartner true to a current partner with an open period', () => {
    const result = normalizePeople([{ name: 'Ana', isPartner: true, events: [] }])[0]
    expect(result.partnerStatus).toBe('current')
    expect(result.partnerFrom).toBe('')
    expect(result.isPartner).toBeUndefined()
  })
  it('preserves partner period fields for a past partner', () => {
    const people = [
      {
        name: 'Ana',
        partnerStatus: 'past',
        partnerFrom: '2023.01.01',
        partnerTo: '2023.12.31',
        events: [],
      },
    ]
    const result = normalizePeople(people)[0]
    expect(result.partnerStatus).toBe('past')
    expect(result.partnerFrom).toBe('2023.01.01')
    expect(result.partnerTo).toBe('2023.12.31')
  })
  it('clears partnerTo for a current partner and dates for never', () => {
    const people = [
      {
        name: 'Ana',
        partnerStatus: 'current',
        partnerFrom: '2023.01.01',
        partnerTo: '2024.01.01',
        events: [],
      },
      {
        name: 'Bob',
        partnerStatus: 'never',
        partnerFrom: '2023.01.01',
        partnerTo: '2024.01.01',
        events: [],
      },
    ]
    const [ana, bob] = normalizePeople(people)
    expect(ana.partnerFrom).toBe('2023.01.01')
    expect(ana.partnerTo).toBe('')
    expect(bob.partnerFrom).toBe('')
    expect(bob.partnerTo).toBe('')
  })
  it('resolves an invalid partnerStatus to current with legacy isPartner true', () => {
    const people = [{ name: 'Ana', partnerStatus: 'maybe', isPartner: true, events: [] }]
    const result = normalizePeople(people)[0]
    expect(result.partnerStatus).toBe('current')
    expect(result.isPartner).toBeUndefined()
  })
  it('clears a partner date that is not a valid yyyy.MM.dd string', () => {
    const people = [
      { name: 'Ana', partnerStatus: 'current', partnerFrom: '2023-01-01', events: [] },
      { name: 'Bob', partnerStatus: 'current', partnerFrom: '2023.02.30', events: [] },
      { name: 'Cleo', partnerStatus: 'current', partnerFrom: 20230101, events: [] },
      {
        name: 'Dan',
        partnerStatus: 'past',
        partnerFrom: 'bad',
        partnerTo: '2023.12.31',
        events: [],
      },
    ]
    const [ana, bob, cleo, dan] = normalizePeople(people)
    expect(ana.partnerFrom).toBe('')
    expect(bob.partnerFrom).toBe('')
    expect(cleo.partnerFrom).toBe('')
    expect(dan.partnerStatus).toBe('past')
    expect(dan.partnerFrom).toBe('')
    expect(dan.partnerTo).toBe('2023.12.31')
  })
  it('drops partnerFrom and keeps partnerTo on an inverted range', () => {
    const people = [
      {
        name: 'Ana',
        partnerStatus: 'past',
        partnerFrom: '2024.01.01',
        partnerTo: '2023.12.31',
        events: [],
      },
    ]
    const result = normalizePeople(people)[0]
    expect(result.partnerStatus).toBe('past')
    expect(result.partnerFrom).toBe('')
    expect(result.partnerTo).toBe('2023.12.31')
  })
  it('turns a past partner without a valid partnerTo into never', () => {
    const people = [
      { name: 'Ana', partnerStatus: 'past', partnerFrom: '2023.01.01', events: [] },
      { name: 'Bob', partnerStatus: 'past', partnerFrom: '2023.01.01', partnerTo: '', events: [] },
      {
        name: 'Cleo',
        partnerStatus: 'past',
        partnerFrom: '2023.01.01',
        partnerTo: 'bad',
        events: [],
      },
    ]
    for (const result of normalizePeople(people)) {
      expect(result.partnerStatus).toBe('never')
      expect(result.partnerFrom).toBe('')
      expect(result.partnerTo).toBe('')
    }
  })
  it('keeps future partner dates', () => {
    const people = [
      {
        name: 'Ana',
        partnerStatus: 'past',
        partnerFrom: '2998.01.01',
        partnerTo: '2999.01.01',
        events: [],
      },
    ]
    const result = normalizePeople(people)[0]
    expect(result.partnerFrom).toBe('2998.01.01')
    expect(result.partnerTo).toBe('2999.01.01')
  })
  it('leaves already normalized partner data unchanged', () => {
    const once = normalizePeople([
      {
        name: 'Ana',
        partnerStatus: 'past',
        partnerFrom: '2024.01.01',
        partnerTo: '2023.12.31',
        events: [],
      },
    ])
    expect(normalizePeople(once)).toEqual(once)
  })
  it('replaces a missing events field with an empty array', () => {
    const people = [{ name: 'Ana' }]
    expect(normalizePeople(people)[0].events).toEqual([])
  })
  it('replaces a non-array events field with an empty array', () => {
    const people = [{ name: 'Ana', events: null }]
    expect(normalizePeople(people)[0].events).toEqual([])
  })
  it('preserves all other person fields', () => {
    const people = [{ name: 'Ana', age: 30, gender: 'female', events: [] }]
    const result = normalizePeople(people)[0]
    expect(result.age).toBe(30)
    expect(result.gender).toBe('female')
  })
  it('preserves place, situation and observations on events', () => {
    const people = [
      {
        name: 'Ana',
        events: [{ place: 'café', situation: 'first date', observations: 'nice', score: 3 }],
      },
    ]
    const event = normalizePeople(people)[0].events[0]
    expect(event.place).toBe('café')
    expect(event.situation).toBe('first date')
    expect(event.observations).toBe('nice')
  })
  it('preserves null detail and undefined observations on events unchanged', () => {
    const people = [{ name: 'Ana', events: [{ detail: null, observations: undefined, score: 1 }] }]
    const event = normalizePeople(people)[0].events[0]
    expect(event.detail).toBeNull()
    expect(event.observations).toBeUndefined()
  })
})

describe('mergePeopleFieldTags', () => {
  it('returns existing tags unchanged when people array is empty', () => {
    expect(mergePeopleFieldTags([], ['Party'], 'howWeMet')).toEqual(['Party'])
  })

  it('appends new values found in person fields', () => {
    expect(mergePeopleFieldTags([{ howWeMet: 'App' }], [], 'howWeMet')).toEqual(['App'])
  })

  it('works for a different person field (activity)', () => {
    expect(mergePeopleFieldTags([{ activity: 'works' }], [], 'activity')).toEqual(['works'])
  })

  it('preserves existing tags at the front', () => {
    const result = mergePeopleFieldTags([{ howWeMet: 'App' }], ['Friends'], 'howWeMet')
    expect(result).toEqual(['Friends', 'App'])
  })

  it('skips values that already exist in tags (case-insensitive)', () => {
    expect(mergePeopleFieldTags([{ howWeMet: 'app' }], ['App'], 'howWeMet')).toEqual(['App'])
    expect(mergePeopleFieldTags([{ howWeMet: 'APP' }], ['App'], 'howWeMet')).toEqual(['App'])
  })

  it('deduplicates across multiple people', () => {
    const people = [{ howWeMet: 'App' }, { howWeMet: 'app' }]
    expect(mergePeopleFieldTags(people, [], 'howWeMet')).toEqual(['App'])
  })

  it('ignores empty and whitespace-only values', () => {
    expect(mergePeopleFieldTags([{ howWeMet: '' }, { howWeMet: '  ' }], [], 'howWeMet')).toEqual([])
  })

  it('trims whitespace before comparing', () => {
    expect(mergePeopleFieldTags([{ howWeMet: '  App  ' }], ['App'], 'howWeMet')).toEqual(['App'])
  })

  it('preserves casing of existing tags on duplicate', () => {
    const result = mergePeopleFieldTags([{ howWeMet: 'app' }], ['App'], 'howWeMet')
    expect(result[0]).toBe('App')
  })

  it('preserves casing of first new occurrence', () => {
    const people = [{ howWeMet: 'First Date' }, { howWeMet: 'first date' }]
    expect(mergePeopleFieldTags(people, [], 'howWeMet')).toEqual(['First Date'])
  })

  it('skips people without the requested field', () => {
    expect(mergePeopleFieldTags([{ name: 'Ana' }], [], 'howWeMet')).toEqual([])
  })

  it('does not mutate the existingTags array', () => {
    const existing = ['Friends']
    mergePeopleFieldTags([{ howWeMet: 'App' }], existing, 'howWeMet')
    expect(existing).toEqual(['Friends'])
  })
})

describe('countTagUses', () => {
  it('returns one count per tag, in tag order', () => {
    expect(countTagUses(['Bar', 'Park'], ['Park', 'Bar', 'Park'])).toEqual([1, 2])
  })

  it('returns zero for tags no value uses', () => {
    expect(countTagUses(['Bar', 'Park'], ['Bar'])).toEqual([1, 0])
  })

  it('ignores case and surrounding spaces on both sides', () => {
    expect(countTagUses([' Chilean'], ['chilean ', 'CHILEAN'])).toEqual([2])
  })

  it('skips empty, whitespace-only and missing values', () => {
    expect(countTagUses(['Bar'], ['', '  ', undefined, null])).toEqual([0])
  })

  it('returns an empty list when there are no tags', () => {
    expect(countTagUses([], ['Bar'])).toEqual([])
  })
})

describe('TAG_FIELDS', () => {
  it('lists the four tag fields with where they are stored', () => {
    expect(TAG_FIELDS).toEqual({
      howWeMet: { onEvents: false, required: true },
      nationality: { onEvents: false, required: false },
      situation: { onEvents: true, required: true },
      place: { onEvents: true, required: true },
    })
  })
})

describe('tagFieldValues', () => {
  const people = [
    { howWeMet: 'App', events: [{ place: 'Bar' }, { place: 'Park' }] },
    { howWeMet: 'School' },
  ]

  it('returns one value per person for person fields', () => {
    expect(tagFieldValues(people, 'howWeMet')).toEqual(['App', 'School'])
  })

  it('returns one value per event for event fields, skipping people without events', () => {
    expect(tagFieldValues(people, 'place')).toEqual(['Bar', 'Park'])
  })
})

describe('clearTagFromPeople', () => {
  it('empties a person field that matches, ignoring case and spaces', () => {
    const people = [
      { id: 'a', howWeMet: ' app ' },
      { id: 'b', howWeMet: 'School' },
    ]
    expect(clearTagFromPeople(people, 'howWeMet', 'App')).toEqual([
      { id: 'a', howWeMet: '' },
      { id: 'b', howWeMet: 'School' },
    ])
  })

  it('empties only the matching events and keeps the rest of each record', () => {
    const people = [
      {
        id: 'a',
        name: 'Ana',
        events: [
          { id: 'e1', place: 'BAR', situation: 'Date' },
          { id: 'e2', place: 'Park', situation: 'Date' },
        ],
      },
    ]
    expect(clearTagFromPeople(people, 'place', 'Bar')).toEqual([
      {
        id: 'a',
        name: 'Ana',
        events: [
          { id: 'e1', place: '', situation: 'Date' },
          { id: 'e2', place: 'Park', situation: 'Date' },
        ],
      },
    ])
  })

  it('keeps unchanged people as the same objects', () => {
    const untouched = { id: 'b', howWeMet: 'School', events: [{ place: 'Park' }] }
    const noEvents = { id: 'c' }
    const result = clearTagFromPeople([untouched, noEvents], 'place', 'Bar')
    expect(result[0]).toBe(untouched)
    expect(result[1]).toBe(noEvents)
    expect(clearTagFromPeople([untouched], 'howWeMet', 'App')[0]).toBe(untouched)
  })

  it('never matches empty values with a blank tag', () => {
    const person = { id: 'a', nationality: '' }
    expect(clearTagFromPeople([person], 'nationality', '  ')[0]).toBe(person)
  })

  it('does not mutate the input', () => {
    const people = [{ id: 'a', events: [{ place: 'Bar' }] }]
    clearTagFromPeople(people, 'place', 'Bar')
    expect(people[0].events[0].place).toBe('Bar')
  })
})

describe('createPerson', () => {
  it('adds an id and an initial empty event dated today', () => {
    const person = createPerson({ name: 'Mia', realName: 'Maria', howWeMet: 'School' })
    expect(person).toMatchObject({ name: 'Mia', realName: 'Maria', howWeMet: 'School' })
    expect(person.id).toMatch(/^[a-z0-9]+$/)
    expect(person.events).toEqual([
      { id: expect.any(String), date: todayString(), details: '', score: null },
    ])
    expect(person.events[0].id).not.toBe(person.id)
  })

  it('defaults the optional text fields to empty strings', () => {
    expect(createPerson({ name: 'Mia' })).toMatchObject({ realName: '', howWeMet: '' })
  })
})
