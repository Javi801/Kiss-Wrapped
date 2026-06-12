import { GENDER_COLORS, ZODIAC_OPTIONS } from '@/lib/constants'

// Translate activity key into localized label.
export function translateActivity(value, t) {
  if (value === 'studies') return t.studies
  if (value === 'works') return t.works
  if (value === 'studies and works') return t.studiesWorks
  return t.other
}

// Translate gender key into localized label.
export function translateGender(value, t) {
  if (value === 'male') return t.male
  if (value === 'female') return t.female
  return t.other
}

// Check if an event is missing any required field.
export function eventIsMissingRequired(event) {
  return !event.place?.trim() || !event.situation?.trim()
}

// Check if a person or any of their events is missing required fields.
export function personHasIncompleteEvent(person) {
  const personMissing =
    !person.name?.trim() ||
    !person.birthYear ||
    !person.gender ||
    !person.zodiacSign ||
    !person.activity ||
    !person.howWeMet?.trim()

  return personMissing || (person.events || []).some(eventIsMissingRequired)
}

// Validate score is an integer between 0 and 5.
export function hasScore(score) {
  return Number.isInteger(score) && score >= 0 && score <= 5
}

// Render kisses emoji representation of score.
export function renderKisses(score, t) {
  if (!hasScore(score)) return t.noScore
  return '💋'.repeat(score) || t.noScore
}

// Translate a stored zodiac string to the target language using the emoji as key.
export function getZodiacForLanguage(zodiacSign, language) {
  if (!zodiacSign) return zodiacSign
  const emoji = zodiacSign.charAt(0)
  return ZODIAC_OPTIONS[language]?.find((opt) => opt.charAt(0) === emoji) ?? zodiacSign
}

// Extract short zodiac label from full string.
export function getShortZodiacLabel(value) {
  if (!value) return ''
  const cleaned = value.replace(/^[^\wA-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/, '')
  return cleaned.split(' (')[0].trim()
}

// Return color based on category label.
export function getColorForCategory(label) {
  // Normalize the label to simplify matching.
  const normalized = String(label).toLowerCase()

  // Match female-related labels before male to avoid "female".includes("male") false match.
  if (normalized.includes('female') || normalized.includes('femen')) {
    return GENDER_COLORS.female
  }

  // Match male-related labels.
  if (normalized.includes('male') || normalized.includes('mascul')) {
    return GENDER_COLORS.male
  }

  // Match generic "other" labels.
  if (normalized.includes('other') || normalized.includes('otro')) {
    return GENDER_COLORS.other
  }

  // Return null when no category color is defined.
  return null
}
