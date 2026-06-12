import { hasScore } from '@/lib/format'

// Generates a short unique id for entities
export function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// Normalizes people data ensuring events array and valid scores
export function normalizePeople(rawPeople) {
  return Array.isArray(rawPeople)
    ? rawPeople.map((person) => ({
        ...person,
        realName: person.realName || '',
        events: Array.isArray(person.events)
          ? person.events.map((event) => ({
              ...event,
              score: hasScore(event.score) ? event.score : null,
            }))
          : [],
      }))
    : []
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
