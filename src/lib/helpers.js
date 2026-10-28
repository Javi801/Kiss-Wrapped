import { hasScore } from '@/lib/format'
import { todayString } from '@/lib/date'
import { sanitizePartnerFields } from '@/lib/partner'

// Generates a short unique id for entities
export function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// Builds a new person from the person form values, with an initial empty event dated today.
export function createPerson(values) {
  return {
    id: uid(),
    ...values,
    realName: values.realName || '',
    howWeMet: values.howWeMet || '',
    events: [
      {
        id: uid(),
        date: todayString(),
        details: '',
        score: null,
      },
    ],
  }
}

// Normalizes people data ensuring events array, valid scores, and partner fields.
// Legacy boolean isPartner records migrate to a "current" partner with an open period.
// Invalid partner data falls back automatically (see sanitizePartnerFields).
export function normalizePeople(rawPeople) {
  if (!Array.isArray(rawPeople)) return []
  return rawPeople.map((rawPerson) => {
    const { isPartner: _isPartner, ...person } = rawPerson
    return {
      ...person,
      realName: person.realName || '',
      nationality: person.nationality || '',
      ...sanitizePartnerFields(rawPerson),
      events: Array.isArray(person.events)
        ? person.events.map((event) => ({
            ...event,
            score: hasScore(event.score) ? event.score : null,
          }))
        : [],
    }
  })
}

// Merges event field values from existing people data into a tag list.
// Tags from `existingTags` take priority; new ones are appended preserving
// their original casing. Comparison is case-insensitive so duplicates are skipped.
export function mergeEventTagsFromPeople(people, existingTags, field) {
  const seen = new Set(existingTags.map((t) => t.toLowerCase()))
  const merged = [...existingTags]
  for (const person of people) {
    for (const event of person.events || []) {
      const s = event[field]?.trim()
      if (s && !seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase())
        merged.push(s)
      }
    }
  }
  return merged
}

export function mergePeopleFieldTags(people, existingTags, field) {
  const seen = new Set(existingTags.map((t) => t.toLowerCase()))
  const merged = [...existingTags]
  for (const person of people) {
    const s = person[field]?.trim()
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase())
      merged.push(s)
    }
  }
  return merged
}

// Counts how many of `values` match each tag, ignoring case and surrounding spaces
// like the merge functions above. Returns one count per tag, in `tags` order.
export function countTagUses(tags, values) {
  const counts = new Map()
  for (const value of values) {
    const key = value?.trim().toLowerCase()
    if (key) counts.set(key, (counts.get(key) || 0) + 1)
  }
  return tags.map((tag) => counts.get(tag.trim().toLowerCase()) || 0)
}

// Converts hex color to RGB object
export function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const bigint = parseInt(normalized, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}
