import { effectiveAge } from '@/lib/date'
import { getFirstEventDate, getLastEventDate } from '@/lib/stats'

export const ALPHA_INDEX = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')]

export function emptyFilters() {
  return {
    minAge: '',
    maxAge: '',
    activity: [],
    howWeMet: [],
    nationality: [],
    zodiacSign: [],
    eventDateFrom: '',
    eventDateTo: '',
  }
}

function normalizeTag(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

export function filterPeople(people, query, filters) {
  const q = query.trim().toLowerCase()

  return people.filter((person) => {
    const searchable = [
      person.name,
      person.realName || '',
      person.detail || '',
      person.howWeMet || '',
      ...(person.events || []).map((event) => event.details || ''),
    ]
      .join(' ')
      .toLowerCase()

    const selectedHowWeMet = filters.howWeMet ?? []
    const selectedNationality = filters.nationality ?? []
    const matchesQuery = !q || searchable.includes(q)
    const age = effectiveAge(person)
    const matchesMinAge = !filters.minAge || age >= Number(filters.minAge)
    const matchesMaxAge = !filters.maxAge || age <= Number(filters.maxAge)
    const matchesActivity =
      filters.activity.length === 0 || filters.activity.includes(person.activity)
    const matchesHowWeMet =
      selectedHowWeMet.length === 0 ||
      selectedHowWeMet.some((tag) => normalizeTag(person.howWeMet) === normalizeTag(tag))
    const matchesNationality =
      selectedNationality.length === 0 ||
      selectedNationality.some((tag) => normalizeTag(person.nationality) === normalizeTag(tag))
    const matchesZodiac =
      filters.zodiacSign.length === 0 ||
      filters.zodiacSign.some((z) => z[0] === person.zodiacSign?.[0])
    const matchesEventDate = (() => {
      if (!filters.eventDateFrom && !filters.eventDateTo) return true
      return (person.events || []).some((event) => {
        if (!event.date) return false
        if (filters.eventDateFrom && event.date < filters.eventDateFrom) return false
        if (filters.eventDateTo && event.date > filters.eventDateTo) return false
        return true
      })
    })()

    return (
      matchesQuery &&
      matchesMinAge &&
      matchesMaxAge &&
      matchesActivity &&
      matchesHowWeMet &&
      matchesNationality &&
      matchesZodiac &&
      matchesEventDate
    )
  })
}

export function sortPeople(people, sortBy) {
  return [...people].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    }
    if (sortBy === 'firstEventDate') {
      const aDate = getFirstEventDate(a) || '9999.99.99'
      const bDate = getFirstEventDate(b) || '9999.99.99'
      return aDate.localeCompare(bDate)
    }
    const aDate = getLastEventDate(a) || '0000.00.00'
    const bDate = getLastEventDate(b) || '0000.00.00'
    return bDate.localeCompare(aDate)
  })
}

// Returns [groupKey, members] pairs sorted by key.
export function groupPeople(people, groupBy, t) {
  const groups = {}

  for (const person of people) {
    let key = t.ungrouped

    if (groupBy === 'name') {
      const first = person.name[0]?.toUpperCase() || '#'
      key = /^[A-Z]$/.test(first) ? first : '#'
    }

    if (groupBy === 'lastEventDate') {
      key = getLastEventDate(person) || t.noEvents
    }

    if (!groups[key]) {
      groups[key] = []
    }

    groups[key].push(person)
  }

  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}
