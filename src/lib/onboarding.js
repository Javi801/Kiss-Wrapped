import { ACTIVITIES, GENDERS, SCORE_OPTIONS, ZODIAC_OPTIONS } from '@/lib/constants'
import { LIMITS, ONBOARDING } from '@/lib/config'
import {
  deriveBirthYear,
  isFutureDate,
  isValidDateString,
  isWithinZodiacPeriod,
  todayString,
} from '@/lib/date'
import { PARTNER_STATUSES } from '@/lib/partner'

// What a tour scene can point at besides a screen: `data` and `settings` on the
// home screen, `card` and `addEvent` on the person card. Navigation buttons and
// bottom-bar items are named by the screen they lead to (`SCREENS`).
export const TOUR_TARGETS = {
  data: 'data',
  settings: 'settings',
  card: 'card',
  addEvent: 'addEvent',
}

// DOM hooks the tour relies on: the role of the speech bubbles and the attribute
// that marks the control a scene asks the user to tap.
export const SPEECH_BUBBLE_ROLE = 'note'
export const TOUR_TARGET_ATTRIBUTE = 'data-tour-target'

export const SPEECH_BUBBLE_SELECTOR = `[role="${SPEECH_BUBBLE_ROLE}"]`

// What stays reachable on the screens during a tour: the speech bubbles, so they
// are still read aloud, and the control a scene asks the user to tap.
export const TOUR_KEEP_SELECTOR = `${SPEECH_BUBBLE_SELECTOR}, [${TOUR_TARGET_ATTRIBUTE}]`

// Stacking order of the onboarding. `wizard` lifts the whole wizard above the app. The
// rest stack inside it, from back to front: the `backdrop` that dims a hinted scene, the
// `raised` controls and speech bubbles that scene points at, and the tour `button`.
export const TOUR_LAYERS = {
  wizard: 20,
  backdrop: 1,
  raised: 2,
  button: 3,
}

// The control a scene points at holds the tap guide and still takes taps.
const TOUR_TARGET_STYLE = { position: 'relative', pointerEvents: 'auto' }

/**
 * Props of a control the tour can point at: its `style` and, while `guided`, what keeps
 * it reachable during the tour. Spread them on the control, which renders its own tap guide.
 */
export function tourTargetProps(guided, style) {
  if (!guided) return { style }
  return { style: { ...style, ...TOUR_TARGET_STYLE }, [TOUR_TARGET_ATTRIBUTE]: '' }
}

// Fails on load when a fallback is not one of the supported values of its list.
function supportedValue(list, value) {
  if (!list.includes(value)) throw new Error(`Unsupported onboarding fallback: ${value}`)
  return value
}

// Values the practice person gets when the form has no valid one.
const FALLBACK_GENDER = supportedValue(GENDERS, 'other')
const FALLBACK_ACTIVITY = supportedValue(ACTIVITIES, 'other')
// The practice person is never a partner, whatever the form holds.
const PRACTICE_PARTNER_STATUS = supportedValue(PARTNER_STATUSES, 'never')

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
  const age = isValidAge(values.age) ? Number(values.age) : ONBOARDING.practiceAge

  return {
    name: (values.name || '').trim() || t.onboardingPracticeName,
    realName: '',
    gender: GENDERS.includes(values.gender) ? values.gender : FALLBACK_GENDER,
    howWeMet: '',
    zodiacSign,
    activity: ACTIVITIES.includes(values.activity) ? values.activity : FALLBACK_ACTIVITY,
    detail: (values.detail || '').trim(),
    partnerStatus: PRACTICE_PARTNER_STATUS,
    partnerFrom: '',
    partnerTo: '',
    birthYear: deriveBirthYear(age, zodiacSign, birthdayAlreadyHappened),
    birthdayAlreadyHappened,
  }
}

/**
 * Builds the practice event of the onboarding from a partly filled event form.
 * Keeps every valid value and fills the rest, returning the shape `EventForm` saves.
 */
export function completePracticeEvent(values, t) {
  const hasDate = isValidDateString(values.date) && !isFutureDate(values.date)
  // The form holds the score as a string, 'none' when it is not set.
  const score = /^\d+$/.test(String(values.score)) ? Number(values.score) : null

  return {
    date: hasDate ? values.date : todayString(),
    details: (values.details || '').trim(),
    score: SCORE_OPTIONS.includes(score) ? score : null,
    place: (values.place || '').trim() || t.onboardingPracticePlace,
    situation: (values.situation || '').trim() || t.onboardingPracticeSituation,
    observations: (values.observations || '').trim(),
  }
}
