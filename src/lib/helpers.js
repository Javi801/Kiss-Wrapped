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

// Fields whose values are kept as tag lists: where they are stored (on the person or
// on its events) and whether a record without them is incomplete.
export const TAG_FIELDS = {
  howWeMet: { onEvents: false, required: true },
  nationality: { onEvents: false, required: false },
  situation: { onEvents: true, required: true },
  place: { onEvents: true, required: true },
}

const tagKey = (value) => value?.trim().toLowerCase() || ''

// Returns every stored value of a tag field, one per person or one per event.
export function tagFieldValues(people, field) {
  return TAG_FIELDS[field].onEvents
    ? people.flatMap((person) => (person.events || []).map((event) => event[field]))
    : people.map((person) => person[field])
}

// Counts how many of `values` match each tag, ignoring case and surrounding spaces
// like the merge functions above. Returns one count per tag, in `tags` order.
export function countTagUses(tags, values) {
  const counts = new Map()
  for (const value of values) {
    const key = tagKey(value)
    if (key) counts.set(key, (counts.get(key) || 0) + 1)
  }
  return tags.map((tag) => counts.get(tagKey(tag)) || 0)
}

// Empties the values of a tag field that match `tag` (ignoring case and surrounding
// spaces), so the merge at boot does not bring the tag back. Records stay; only
// that field is cleared. Unchanged people keep their identity.
export function clearTagFromPeople(people, field, tag) {
  const key = tagKey(tag)
  const matches = (record) => key !== '' && tagKey(record[field]) === key

  if (!TAG_FIELDS[field].onEvents) {
    return people.map((person) => (matches(person) ? { ...person, [field]: '' } : person))
  }
  return people.map((person) =>
    (person.events || []).some(matches)
      ? {
          ...person,
          events: person.events.map((event) =>
            matches(event) ? { ...event, [field]: '' } : event
          ),
        }
      : person
  )
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
