import { isValidDateString, isFutureDate } from '@/lib/date'

export const PARTNER_STATUSES = ['never', 'current', 'past']

// Error codes returned by validatePartnerFields; callers map them to translated text
export const PARTNER_ERRORS = {
  unknownStatus: 'unknownStatus',
  invalidDate: 'invalidDate',
  futureDate: 'futureDate',
  missingEnd: 'missingEnd',
  invertedRange: 'invertedRange',
}

const isEmpty = (value) => value === undefined || value === null || value === ''

const isValidDate = (value) => typeof value === 'string' && isValidDateString(value)

function dateError(value) {
  if (!isValidDate(value)) return PARTNER_ERRORS.invalidDate
  if (isFutureDate(value)) return PARTNER_ERRORS.futureDate
  return null
}

// Returns the stored status, migrating the legacy isPartner flag when the status is missing or unknown
export function resolvePartnerStatus(rawPerson) {
  if (PARTNER_STATUSES.includes(rawPerson.partnerStatus)) return rawPerson.partnerStatus
  return rawPerson.isPartner === true ? 'current' : 'never'
}

// Returns an error code per invalid field (status, partnerFrom, partnerTo); an empty object means valid.
// Only the dates used by the status are checked. Values are not trimmed.
export function validatePartnerFields({ partnerStatus, partnerFrom, partnerTo }) {
  const errors = {}

  if (!PARTNER_STATUSES.includes(partnerStatus)) {
    errors.status = PARTNER_ERRORS.unknownStatus
    return errors
  }

  if (partnerStatus !== 'never' && !isEmpty(partnerFrom)) {
    const error = dateError(partnerFrom)
    if (error) errors.partnerFrom = error
  }

  if (partnerStatus === 'past') {
    const error = isEmpty(partnerTo) ? PARTNER_ERRORS.missingEnd : dateError(partnerTo)
    if (error) errors.partnerTo = error
    else if (!isEmpty(partnerFrom) && !errors.partnerFrom && partnerFrom > partnerTo)
      errors.partnerTo = PARTNER_ERRORS.invertedRange
  }

  return errors
}

// Returns true when a raw imported person has partner data the user has to resolve.
// An absent partnerStatus follows the legacy isPartner path and is not an issue by itself.
export function hasPartnerIssues(rawPerson) {
  const { partnerStatus, partnerFrom, partnerTo } = rawPerson
  if (partnerStatus !== undefined && partnerStatus !== null) {
    if (!PARTNER_STATUSES.includes(partnerStatus)) return true
  }

  const errors = validatePartnerFields({
    partnerStatus: resolvePartnerStatus(rawPerson),
    partnerFrom,
    partnerTo,
  })
  return Object.keys(errors).length > 0
}

// Automatic fallback for partner data that cannot be shown to the user for fixing.
// Future dates are kept so the result does not depend on the day it runs.
export function sanitizePartnerFields(rawPerson) {
  const partnerStatus = resolvePartnerStatus(rawPerson)
  let partnerFrom =
    partnerStatus !== 'never' && isValidDate(rawPerson.partnerFrom) ? rawPerson.partnerFrom : ''
  const partnerTo =
    partnerStatus === 'past' && isValidDate(rawPerson.partnerTo) ? rawPerson.partnerTo : ''

  if (partnerStatus === 'past' && !partnerTo) {
    return { partnerStatus: 'never', partnerFrom: '', partnerTo: '' }
  }

  if (partnerFrom && partnerTo && partnerFrom > partnerTo) partnerFrom = ''

  return { partnerStatus, partnerFrom, partnerTo }
}
