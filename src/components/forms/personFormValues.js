import { LIMITS } from '@/lib/config'
import { calculateDisplayAge, deriveBirthYear, isWithinZodiacPeriod } from '@/lib/date'
import { getZodiacForLanguage, translatePartnerError } from '@/lib/format'
import { PARTNER_STATUSES, validatePartnerFields } from '@/lib/partner'

const EMPTY_FORM = {
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
}

// Form values of a stored person, with the age derived from its birth year and the sign in
// `language`. Without a person, the values of an empty form.
export function toPersonFormState(initialValues, language) {
  if (!initialValues) return { ...EMPTY_FORM }
  const zodiacSign = getZodiacForLanguage(initialValues.zodiacSign, language)
  const displayAge = initialValues.birthYear
    ? String(
        calculateDisplayAge(
          initialValues.birthYear,
          zodiacSign,
          initialValues.birthdayAlreadyHappened
        ) ?? ''
      )
    : String(initialValues.age ?? '')
  return {
    ...initialValues,
    zodiacSign,
    age: displayAge,
    realName: initialValues.realName ?? '',
    nationality: initialValues.nationality ?? '',
    howWeMet: initialValues.howWeMet ?? '',
    detail: initialValues.detail ?? '',
    partnerStatus: PARTNER_STATUSES.includes(initialValues.partnerStatus)
      ? initialValues.partnerStatus
      : 'never',
    partnerFrom: initialValues.partnerFrom ?? '',
    partnerTo: initialValues.partnerTo ?? '',
  }
}

// Translated error per invalid field; empty when the form can be saved.
export function validatePersonForm(form, { includeHowWeMet }, t) {
  const errors = {}

  if (!form.name.trim()) errors.name = t.requiredName

  if (!String(form.age).trim()) errors.age = t.requiredAge
  else if (
    !Number.isInteger(Number(form.age)) ||
    Number(form.age) <= 0 ||
    Number(form.age) > LIMITS.maxAge
  )
    errors.age = t.validAge

  if (!form.gender) errors.gender = t.requiredGender

  if (includeHowWeMet && !form.howWeMet.trim()) errors.howWeMet = t.requiredHowWeMet

  if (!form.zodiacSign) errors.zodiacSign = t.requiredZodiac

  if (!form.activity) errors.activity = t.requiredActivity

  // Partner period: optional start; a past partner needs a valid end after the start.
  const partnerErrors = validatePartnerFields({
    partnerStatus: form.partnerStatus,
    partnerFrom: form.partnerFrom.trim(),
    partnerTo: form.partnerTo.trim(),
  })
  for (const [field, code] of Object.entries(partnerErrors)) {
    errors[field] = translatePartnerError(code, t)
  }

  return errors
}

// Person to save from valid form values. The birthday answer counts only while the sign is
// running, and a hidden optional field keeps the stored value.
export function toPersonPayload(
  form,
  { initialValues, birthdayAlreadyHappened, includeHowWeMet, includeRealName, includeNationality }
) {
  const birthdayAsked = isWithinZodiacPeriod(form.zodiacSign)
  const { age, ...rest } = form
  return {
    ...rest,
    partnerFrom: form.partnerStatus !== 'never' ? form.partnerFrom.trim() : '',
    partnerTo: form.partnerStatus === 'past' ? form.partnerTo.trim() : '',
    birthYear: deriveBirthYear(
      Number(age),
      form.zodiacSign,
      birthdayAsked && birthdayAlreadyHappened
    ),
    birthdayAlreadyHappened: birthdayAsked
      ? birthdayAlreadyHappened
      : (initialValues?.birthdayAlreadyHappened ?? false),
    detail: form.detail.trim(),
    howWeMet: includeHowWeMet ? form.howWeMet.trim() : initialValues?.howWeMet || '',
    name: form.name.trim(),
    realName: includeRealName ? form.realName.trim() : initialValues?.realName || '',
    nationality: includeNationality ? form.nationality.trim() : initialValues?.nationality || '',
  }
}
