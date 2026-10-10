import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { COPY, ZODIAC_OPTIONS } from '@/lib/constants'
import { LIMITS } from '@/lib/config'
import { completePracticePerson } from '@/lib/onboarding'

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

describe('completePracticePerson', () => {
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
