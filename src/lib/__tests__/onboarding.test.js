import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { ACTIVITIES, COPY, GENDERS, SCREENS, ZODIAC_OPTIONS } from '@/lib/constants'
import { LIMITS, ONBOARDING } from '@/lib/config'
import {
  SPEECH_BUBBLE_ROLE,
  SPEECH_BUBBLE_SELECTOR,
  TOUR_KEEP_SELECTOR,
  TOUR_LAYERS,
  TOUR_TARGET_ATTRIBUTE,
  TOUR_TARGETS,
  completePracticeEvent,
  completePracticePerson,
  tourTargetProps,
} from '@/lib/onboarding'
import { PARTNER_STATUSES } from '@/lib/partner'

const t = COPY.en
// Mid-June: Aquarius has already ended this year, Gemini is running.
const NOW = new Date(2024, 5, 15, 12, 0, 0)
const sign = (emoji, language = 'en') =>
  ZODIAC_OPTIONS[language].find((option) => option.startsWith(emoji))
const AQUARIUS = sign('♒')
const GEMINI = sign('♊')

const EMPTY = {
  name: '',
  age: '',
  gender: '',
  zodiacSign: '',
  activity: '',
  detail: '',
  birthdayAlreadyHappened: false,
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('TOUR_TARGETS', () => {
  it('names every target after its key', () => {
    for (const [key, value] of Object.entries(TOUR_TARGETS)) {
      expect(value).toBe(key)
    }
  })

  it('has no duplicated values', () => {
    const values = Object.values(TOUR_TARGETS)
    expect(new Set(values).size).toBe(values.length)
  })

  it('does not reuse a screen name', () => {
    const screens = Object.values(SCREENS)
    for (const target of Object.values(TOUR_TARGETS)) {
      expect(screens).not.toContain(target)
    }
  })
})

describe('tour selectors', () => {
  it('selects the speech bubbles by their role', () => {
    expect(SPEECH_BUBBLE_SELECTOR).toBe(`[role="${SPEECH_BUBBLE_ROLE}"]`)
  })

  it('keeps the speech bubbles and the tour target reachable', () => {
    expect(TOUR_KEEP_SELECTOR.split(', ')).toEqual([
      SPEECH_BUBBLE_SELECTOR,
      `[${TOUR_TARGET_ATTRIBUTE}]`,
    ])
  })

  it('marks the tour target with a data attribute', () => {
    expect(TOUR_TARGET_ATTRIBUTE.startsWith('data-')).toBe(true)
  })
})

describe('TOUR_LAYERS', () => {
  it('defines every layer as a positive integer', () => {
    for (const [name, value] of Object.entries(TOUR_LAYERS)) {
      expect(Number.isInteger(value), name).toBe(true)
      expect(value, name).toBeGreaterThan(0)
    }
  })

  it('stacks the backdrop below the raised controls and those below the button', () => {
    expect(TOUR_LAYERS.backdrop).toBeLessThan(TOUR_LAYERS.raised)
    expect(TOUR_LAYERS.raised).toBeLessThan(TOUR_LAYERS.button)
  })
})

describe('tourTargetProps', () => {
  it('returns only the style when the control is not guided', () => {
    const style = { color: 'red' }
    const props = tourTargetProps(false, style)
    expect(props).toEqual({ style })
    expect(props.style).toBe(style)
  })

  it('returns only an undefined style when a control without style is not guided', () => {
    expect(tourTargetProps(false)).toEqual({ style: undefined })
    expect(Object.keys(tourTargetProps(false))).toEqual(['style'])
  })

  it('adds the tour style and the target attribute when the control is guided', () => {
    expect(tourTargetProps(true, { color: 'red' })).toEqual({
      style: { color: 'red', position: 'relative', pointerEvents: 'auto' },
      [TOUR_TARGET_ATTRIBUTE]: '',
    })
  })

  it('lets the tour style win over the given style', () => {
    const props = tourTargetProps(true, { position: 'absolute', pointerEvents: 'none', top: 0 })
    expect(props.style).toEqual({ position: 'relative', pointerEvents: 'auto', top: 0 })
  })

  it('handles a guided control without style', () => {
    expect(tourTargetProps(true)).toEqual({
      style: { position: 'relative', pointerEvents: 'auto' },
      [TOUR_TARGET_ATTRIBUTE]: '',
    })
  })

  it('does not mutate the given style', () => {
    const style = { position: 'absolute', color: 'red' }
    const props = tourTargetProps(true, style)
    expect(style).toEqual({ position: 'absolute', color: 'red' })
    expect(props.style).not.toBe(style)
  })

  it('returns a new style on every call', () => {
    const first = tourTargetProps(true, {})
    first.style.position = 'fixed'
    expect(tourTargetProps(true, {}).style.position).toBe('relative')
  })
})

describe('completePracticePerson', () => {
  it('falls back to supported values', () => {
    const person = completePracticePerson(EMPTY, 'en', t)
    expect(GENDERS).toContain(person.gender)
    expect(ACTIVITIES).toContain(person.activity)
    expect(PARTNER_STATUSES).toContain(person.partnerStatus)
  })

  it('falls back to the configured practice age', () => {
    // Aquarius has already ended, so the birthday of this year has passed.
    expect(completePracticePerson(EMPTY, 'en', t).birthYear).toBe(
      NOW.getFullYear() - ONBOARDING.practiceAge
    )
  })

  it('never makes the practice person a partner', () => {
    const person = completePracticePerson(
      { ...EMPTY, partnerStatus: 'current', partnerFrom: '2024.01.01', partnerTo: '2024.02.01' },
      'en',
      t
    )
    expect(person).toMatchObject({ partnerStatus: 'never', partnerFrom: '', partnerTo: '' })
  })

  it('fills an empty form with a full example person', () => {
    expect(completePracticePerson(EMPTY, 'en', t)).toEqual({
      name: t.onboardingPracticeName,
      realName: '',
      gender: 'other',
      howWeMet: '',
      zodiacSign: AQUARIUS,
      activity: 'other',
      detail: '',
      partnerStatus: 'never',
      partnerFrom: '',
      partnerTo: '',
      birthYear: 1999,
      birthdayAlreadyHappened: false,
    })
  })

  it('keeps every valid value that was entered', () => {
    const person = completePracticePerson(
      {
        ...EMPTY,
        name: '  Mia ',
        age: '30',
        gender: 'female',
        zodiacSign: GEMINI,
        activity: 'works',
        detail: ' UX design ',
      },
      'en',
      t
    )
    expect(person).toMatchObject({
      name: 'Mia',
      gender: 'female',
      zodiacSign: GEMINI,
      activity: 'works',
      detail: 'UX design',
      birthYear: 1993,
      birthdayAlreadyHappened: false,
    })
  })

  it('keeps the birthday answer of a sign that is running', () => {
    const person = completePracticePerson(
      { ...EMPTY, age: '30', zodiacSign: GEMINI, birthdayAlreadyHappened: true },
      'en',
      t
    )
    expect(person.birthYear).toBe(1994)
    expect(person.birthdayAlreadyHappened).toBe(true)
  })

  it('ignores the birthday answer of a sign that is not running', () => {
    const person = completePracticePerson(
      { ...EMPTY, zodiacSign: AQUARIUS, birthdayAlreadyHappened: true },
      'en',
      t
    )
    expect(person.birthdayAlreadyHappened).toBe(false)
  })

  it('skips the running sign when it picks the example one', () => {
    // Early February: Aquarius, the first option, is running.
    vi.setSystemTime(new Date(2024, 1, 1, 12, 0, 0))
    expect(completePracticePerson(EMPTY, 'en', t).zodiacSign).toBe(sign('♓'))
  })

  it('replaces values that are not valid', () => {
    for (const age of ['0', '-3', '2.5', 'abc', String(LIMITS.maxAge + 1), undefined]) {
      expect(completePracticePerson({ ...EMPTY, age }, 'en', t).birthYear).toBe(1999)
    }
    const person = completePracticePerson(
      { name: '   ', gender: 'robot', zodiacSign: 'Dragon', activity: 'sleeps' },
      'en',
      t
    )
    expect(person).toMatchObject({
      name: t.onboardingPracticeName,
      gender: 'other',
      zodiacSign: AQUARIUS,
      activity: 'other',
      detail: '',
    })
  })

  it('uses the zodiac options of the active language', () => {
    expect(completePracticePerson(EMPTY, 'es', COPY.es).zodiacSign).toBe(sign('♒', 'es'))
    expect(completePracticePerson(EMPTY, 'es', COPY.es).name).toBe(COPY.es.onboardingPracticeName)
  })
})

describe('completePracticeEvent', () => {
  const EMPTY_EVENT = {
    date: '',
    details: '',
    score: 'none',
    place: '',
    situation: '',
    observations: '',
  }

  it('fills an empty form with a full example event dated today', () => {
    expect(completePracticeEvent(EMPTY_EVENT, t)).toEqual({
      date: '2024.06.15',
      details: '',
      score: null,
      place: t.onboardingPracticePlace,
      situation: t.onboardingPracticeSituation,
      observations: '',
    })
  })

  it('keeps every valid value that was entered', () => {
    expect(
      completePracticeEvent(
        {
          date: '2024.03.08',
          details: ' walk ',
          score: '4',
          place: ' Park ',
          situation: ' Date ',
          observations: ' sunny ',
        },
        t
      )
    ).toEqual({
      date: '2024.03.08',
      details: 'walk',
      score: 4,
      place: 'Park',
      situation: 'Date',
      observations: 'sunny',
    })
  })

  it('keeps a score of zero', () => {
    expect(completePracticeEvent({ ...EMPTY_EVENT, score: '0' }, t).score).toBe(0)
  })

  it('replaces values that are not valid', () => {
    for (const date of ['2024.13.40', 'yesterday', '2024.06.16', undefined]) {
      expect(completePracticeEvent({ ...EMPTY_EVENT, date }, t).date).toBe('2024.06.15')
    }
    for (const score of ['', '9', '2.5', 'many', undefined]) {
      expect(completePracticeEvent({ ...EMPTY_EVENT, score }, t).score).toBeNull()
    }
    expect(completePracticeEvent({ place: '   ', situation: '  ' }, t)).toMatchObject({
      place: t.onboardingPracticePlace,
      situation: t.onboardingPracticeSituation,
      details: '',
      observations: '',
    })
  })

  it('uses the example values of the active language', () => {
    expect(completePracticeEvent(EMPTY_EVENT, COPY.es).situation).toBe(
      COPY.es.onboardingPracticeSituation
    )
  })
})
