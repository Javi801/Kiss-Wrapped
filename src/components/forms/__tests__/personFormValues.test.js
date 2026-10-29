import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { COPY, ZODIAC_OPTIONS } from '@/lib/constants'
import { LIMITS } from '@/lib/config'

import {
  toPersonFormState,
  toPersonPayload,
  validatePersonForm,
} from '@/components/forms/personFormValues'

const t = COPY.en
// Mid-June: Aquarius has already ended this year, Gemini is running, Scorpio is still ahead.
const NOW = new Date(2024, 5, 15, 12, 0, 0)
const sign = (emoji, language = 'en') =>
  ZODIAC_OPTIONS[language].find((option) => option.startsWith(emoji))
const AQUARIUS = sign('♒')
const GEMINI = sign('♊')

// Form values that pass every validation.
const validForm = {
  name: 'Mia',
  realName: '',
  nationality: '',
  age: '30',
  gender: 'female',
  howWeMet: 'School',
  zodiacSign: AQUARIUS,
  activity: 'works',
  detail: '',
  partnerStatus: 'never',
  partnerFrom: '',
  partnerTo: '',
}

const shownFields = { includeHowWeMet: true, includeRealName: true, includeNationality: true }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('toPersonFormState', () => {
  it('starts an empty form without a person', () => {
    expect(toPersonFormState(undefined, 'en')).toEqual({
      name: '',
      realName: '',
      nationality: '',
      age: '',
      gender: '',
      howWeMet: '',
      zodiacSign: '',
      activity: '',
      detail: '',
      partnerStatus: 'never',
      partnerFrom: '',
      partnerTo: '',
    })
  })

  it('returns a new object for every empty form', () => {
    const first = toPersonFormState(undefined, 'en')
    first.name = 'Mia'
    expect(toPersonFormState(undefined, 'en').name).toBe('')
  })

  it('derives the age from the birth year', () => {
    expect(toPersonFormState({ birthYear: 1994, zodiacSign: AQUARIUS }, 'en').age).toBe('30')
  })

  it('keeps the stored age of a legacy record without a birth year', () => {
    expect(toPersonFormState({ age: 41, zodiacSign: AQUARIUS }, 'en').age).toBe('41')
  })

  it('leaves the age empty when there is neither a birth year nor an age', () => {
    expect(toPersonFormState({ zodiacSign: AQUARIUS }, 'en').age).toBe('')
  })

  it('shows the sign in the current language', () => {
    expect(toPersonFormState({ zodiacSign: sign('♒', 'es') }, 'en').zodiacSign).toBe(AQUARIUS)
  })

  it('keeps the other stored values and fills the missing optional texts', () => {
    const state = toPersonFormState({ id: 'mia', name: 'Mia', zodiacSign: AQUARIUS }, 'en')
    expect(state).toMatchObject({
      id: 'mia',
      name: 'Mia',
      realName: '',
      nationality: '',
      howWeMet: '',
      detail: '',
      partnerFrom: '',
      partnerTo: '',
    })
  })

  it('keeps a known partner status and its dates', () => {
    const stored = {
      zodiacSign: AQUARIUS,
      partnerStatus: 'past',
      partnerFrom: '2023.01.01',
      partnerTo: '2023.12.31',
    }
    const state = toPersonFormState(stored, 'en')
    expect(state).toMatchObject({
      partnerStatus: 'past',
      partnerFrom: '2023.01.01',
      partnerTo: '2023.12.31',
    })
  })

  it('treats an unknown partner status as never', () => {
    const state = toPersonFormState({ zodiacSign: AQUARIUS, partnerStatus: 'maybe' }, 'en')
    expect(state.partnerStatus).toBe('never')
  })
})

describe('validatePersonForm', () => {
  it('has no errors for a valid form', () => {
    expect(validatePersonForm(validForm, { includeHowWeMet: true }, t)).toEqual({})
  })

  it('reports every missing required field', () => {
    const empty = toPersonFormState(undefined, 'en')
    expect(validatePersonForm(empty, { includeHowWeMet: true }, t)).toEqual({
      name: t.requiredName,
      age: t.requiredAge,
      gender: t.requiredGender,
      howWeMet: t.requiredHowWeMet,
      zodiacSign: t.requiredZodiac,
      activity: t.requiredActivity,
    })
  })

  it('treats blank texts as missing', () => {
    const errors = validatePersonForm(
      { ...validForm, name: '  ', age: ' ', howWeMet: ' ' },
      { includeHowWeMet: true },
      t
    )
    expect(errors).toEqual({
      name: t.requiredName,
      age: t.requiredAge,
      howWeMet: t.requiredHowWeMet,
    })
  })

  it('does not ask how we met when that field is left out', () => {
    const errors = validatePersonForm({ ...validForm, howWeMet: '' }, { includeHowWeMet: false }, t)
    expect(errors).toEqual({})
  })

  it.each(['0', '-3', '2.5', 'abc', String(LIMITS.maxAge + 1)])('rejects the age %s', (age) => {
    expect(validatePersonForm({ ...validForm, age }, { includeHowWeMet: true }, t)).toEqual({
      age: t.validAge,
    })
  })

  it.each(['1', String(LIMITS.maxAge)])('accepts the age %s', (age) => {
    expect(validatePersonForm({ ...validForm, age }, { includeHowWeMet: true }, t)).toEqual({})
  })

  it('translates the partner errors', () => {
    const errors = validatePersonForm(
      { ...validForm, partnerStatus: 'past', partnerFrom: '2023-01-01' },
      { includeHowWeMet: true },
      t
    )
    expect(errors).toEqual({ partnerFrom: t.validDateMsg, partnerTo: t.requiredPartnerTo })
  })

  it('validates the trimmed partner dates', () => {
    const errors = validatePersonForm(
      { ...validForm, partnerStatus: 'current', partnerFrom: ' 2023.01.01 ' },
      { includeHowWeMet: true },
      t
    )
    expect(errors).toEqual({})
  })
})

describe('toPersonPayload', () => {
  const options = (overrides = {}) => ({
    initialValues: undefined,
    birthdayAlreadyHappened: false,
    ...shownFields,
    ...overrides,
  })

  it('saves the trimmed values with a birth year instead of the age', () => {
    const payload = toPersonPayload(
      {
        ...validForm,
        name: '  Mia ',
        realName: ' Maria ',
        nationality: ' Chilean ',
        howWeMet: ' School ',
        detail: ' nurse ',
      },
      options()
    )
    expect(payload).toEqual({
      name: 'Mia',
      realName: 'Maria',
      nationality: 'Chilean',
      gender: 'female',
      howWeMet: 'School',
      zodiacSign: AQUARIUS,
      activity: 'works',
      detail: 'nurse',
      birthYear: 1994,
      birthdayAlreadyHappened: false,
      partnerStatus: 'never',
      partnerFrom: '',
      partnerTo: '',
    })
  })

  it('keeps the values the form does not edit', () => {
    const payload = toPersonPayload({ ...validForm, id: 'mia', events: [] }, options())
    expect(payload).toMatchObject({ id: 'mia', events: [] })
  })

  it('keeps the stored hidden fields', () => {
    const payload = toPersonPayload(
      { ...validForm, realName: 'typed', nationality: 'typed', howWeMet: 'typed' },
      options({
        initialValues: { realName: 'Maria', nationality: 'Chilean', howWeMet: 'Party' },
        includeHowWeMet: false,
        includeRealName: false,
        includeNationality: false,
      })
    )
    expect(payload).toMatchObject({ realName: 'Maria', nationality: 'Chilean', howWeMet: 'Party' })
  })

  it('saves empty hidden fields for a new person', () => {
    const payload = toPersonPayload(
      validForm,
      options({ includeHowWeMet: false, includeRealName: false, includeNationality: false })
    )
    expect(payload).toMatchObject({ realName: '', nationality: '', howWeMet: '' })
  })

  it('uses the birthday answer while the sign is running', () => {
    const form = { ...validForm, zodiacSign: GEMINI }
    expect(toPersonPayload(form, options({ birthdayAlreadyHappened: true }))).toMatchObject({
      birthYear: 1994,
      birthdayAlreadyHappened: true,
    })
    expect(toPersonPayload(form, options({ birthdayAlreadyHappened: false }))).toMatchObject({
      birthYear: 1993,
      birthdayAlreadyHappened: false,
    })
  })

  it('ignores the answer and keeps the stored one when the sign is not running', () => {
    const payload = toPersonPayload(
      validForm,
      options({ birthdayAlreadyHappened: false, initialValues: { birthdayAlreadyHappened: true } })
    )
    expect(payload).toMatchObject({ birthYear: 1994, birthdayAlreadyHappened: true })
  })

  it('keeps only the partner dates of the chosen status', () => {
    const dates = { partnerFrom: ' 2023.01.01 ', partnerTo: ' 2023.12.31 ' }
    const saved = (partnerStatus) =>
      toPersonPayload({ ...validForm, ...dates, partnerStatus }, options())
    expect(saved('never')).toMatchObject({ partnerFrom: '', partnerTo: '' })
    expect(saved('current')).toMatchObject({ partnerFrom: '2023.01.01', partnerTo: '' })
    expect(saved('past')).toMatchObject({ partnerFrom: '2023.01.01', partnerTo: '2023.12.31' })
  })
})
