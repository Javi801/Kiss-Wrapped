import { GENDERS, ZODIAC_OPTIONS } from '@/lib/constants'
import { LIMITS } from '@/lib/config'
import { deriveBirthYear, isWithinZodiacPeriod } from '@/lib/date'

const PRACTICE_AGE = 25
const ACTIVITIES = ['studies', 'works', 'studies and works', 'other']

function isValidAge(value) {
  const age = Number(value)
  return (
    String(value ?? '').trim() !== '' && Number.isInteger(age) && age > 0 && age <= LIMITS.maxAge
  )
}

/**
 * Builds the practice person of the onboarding from a partly filled person form.
 * Keeps every valid value and fills the rest, returning the shape `PersonForm` saves.
 */
export function completePracticePerson(values, language, t) {
  const options = ZODIAC_OPTIONS[language]
  // The fallback sign is outside its period, so the birthday question never applies to it.
  const zodiacSign = options.includes(values.zodiacSign)
    ? values.zodiacSign
    : options.find((option) => !isWithinZodiacPeriod(option))
  const birthdayAlreadyHappened =
    isWithinZodiacPeriod(zodiacSign) && values.birthdayAlreadyHappened === true
  const age = isValidAge(values.age) ? Number(values.age) : PRACTICE_AGE

  return {
    name: (values.name || '').trim() || t.onboardingPracticeName,
    realName: '',
    gender: GENDERS.includes(values.gender) ? values.gender : 'other',
    howWeMet: '',
    zodiacSign,
    activity: ACTIVITIES.includes(values.activity) ? values.activity : 'other',
    detail: (values.detail || '').trim(),
    partnerStatus: 'never',
    partnerFrom: '',
    partnerTo: '',
    birthYear: deriveBirthYear(age, zodiacSign, birthdayAlreadyHappened),
    birthdayAlreadyHappened,
  }
}
