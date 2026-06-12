import { SCORE_OPTIONS } from '@/lib/constants'
import {
  hasScore,
  renderKisses,
  getShortZodiacLabel,
  getZodiacForLanguage,
  translateActivity,
  translateGender,
} from '@/lib/format'
import { getMonthKey, getYearKey, calculateAge } from '@/lib/date'

/**
 * Returns the earliest event date for a person.
 * Dates are stored as yyyy.MM.dd, so string sorting is safe here.
 */
export function getFirstEventDate(person) {
  if (!person.events?.length) return null

  const sorted = [...person.events].sort((a, b) => (a.date > b.date ? 1 : -1))

  return sorted[0]?.date || null
}

/**
 * Returns the latest event date for a person.
 * Dates are stored as yyyy.MM.dd, so string sorting is safe here.
 */
export function getLastEventDate(person) {
  if (!person.events?.length) return null

  const sorted = [...person.events].sort((a, b) => (a.date < b.date ? 1 : -1))

  return sorted[0]?.date || null
}

/**
 * Builds all derived statistics used by charts and PDF export.
 * This function centralizes every aggregation so the UI stays simpler.
 */
export function getStatsData(people, t) {
  // Flatten all events and keep a reference to the person they belong to.
  const allEvents = people.flatMap((person) =>
    (person.events || []).map((event) => ({ ...event, person }))
  )

  // Build ranking of people with the most events.
  const peopleMostEvents = [...people]
    .map((person) => ({
      label: person.name,
      value: person.events?.length || 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Calculate average events per saved person.
  const averageEventsPerPerson = people.length
    ? (allEvents.length / people.length).toFixed(1)
    : '0.0'

  // Extract top person summary for metric cards.
  const mostActivePerson = peopleMostEvents[0]?.label || '—'

  // Calculate average score considering only scored events.
  const mostActiveCount = peopleMostEvents[0]?.value || 0

  // Keep only events with a valid score for score-based metrics.
  const scoredEvents = allEvents.filter((event) => hasScore(event.score))

  // Calculate average score considering only scored events.
  const averageScore = scoredEvents.length
    ? (scoredEvents.reduce((sum, event) => sum + event.score, 0) / scoredEvents.length).toFixed(1)
    : '0.0'

  // Group events by month using yyyy-MM keys.
  const eventsPerMonth = (() => {
    const map = new Map()
    for (const event of allEvents) {
      const key = getMonthKey(event.date)
      if (!key) continue
      map.set(key, (map.get(key) || 0) + 1)
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }))
  })()

  // Group events by year.
  const eventsPerYear = (() => {
    const map = new Map()
    for (const event of allEvents) {
      const key = getYearKey(event.date)
      if (!key) continue
      map.set(key, (map.get(key) || 0) + 1)
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }))
  })()

  // Find people whose events span across two or more years.
  const personsWithEventsInMultipleYears = people
    .map((person) => {
      const years = [
        ...new Set((person.events || []).map((event) => getYearKey(event.date)).filter(Boolean)),
      ].sort()
      return { label: person.name, value: years.length, years }
    })
    .filter((item) => item.value >= 2)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))

  // Sum total events by zodiac sign.
  const eventsByZodiac = (() => {
    const lang = t.studies === 'estudia' ? 'es' : 'en'
    const map = new Map()
    for (const person of people) {
      const key = getShortZodiacLabel(getZodiacForLanguage(person.zodiacSign, lang))
      map.set(key, (map.get(key) || 0) + (person.events?.length || 0))
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }))
  })()

  // Sum total events by translated activity label.
  const eventsByActivity = (() => {
    const map = new Map()
    for (const person of people) {
      const label = translateActivity(person.activity, t)
      map.set(label, (map.get(label) || 0) + (person.events?.length || 0))
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }))
  })()

  // Count how many people belong to each gender.
  const personsByGender = (() => {
    const map = new Map()
    for (const person of people) {
      const label = translateGender(person.gender, t)
      map.set(label, (map.get(label) || 0) + 1)
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }))
  })()

  // Sum total events by gender.
  const eventsByGender = (() => {
    const map = new Map()
    for (const person of people) {
      const label = translateGender(person.gender, t)
      map.set(label, (map.get(label) || 0) + (person.events?.length || 0))
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }))
  })()

  // Count how many people exist for each age.
  const personsByAge = (() => {
    const map = new Map()
    for (const person of people) {
      const age = calculateAge(person.birthYear, person.zodiacSign) ?? person.age
      if (age == null) continue
      map.set(String(age), (map.get(String(age)) || 0) + 1)
    }
    return [...map.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([label, value]) => ({ label, value }))
  })()

  // Count people grouped by the first letter of their name.
  const personsByFirstLetter = (() => {
    const map = new Map()
    for (const person of people) {
      const key = person.name?.[0]?.toUpperCase() || '#'
      map.set(key, (map.get(key) || 0) + 1)
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }))
  })()

  // Count how many events exist for each possible score.
  const scoresByKisses = (() => {
    const map = new Map()
    for (const score of SCORE_OPTIONS) map.set(renderKisses(score, t), 0)
    for (const event of scoredEvents) {
      const label = renderKisses(event.score, t)
      map.set(label, (map.get(label) || 0) + 1)
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }))
  })()

  // Group people by how many events they have.
  const numberOfEventsByNumberOfPersons = (() => {
    const map = new Map()
    for (const person of people) {
      const eventCount = person.events?.length || 0
      map.set(String(eventCount), (map.get(String(eventCount)) || 0) + 1)
    }
    return [...map.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([label, value]) => ({ label, value }))
  })()

  // Compare scored events versus events without a valid score.
  const scoredVsUnscored = [
    {
      label: t.scores,
      value: allEvents.filter((event) => hasScore(event.score)).length,
    },
    {
      label: t.noScore,
      value: allEvents.filter((event) => !hasScore(event.score)).length,
    },
  ]

  // Return every derived dataset in one place for easier consumption.
  return {
    allEvents,
    averageEventsPerPerson,
    mostActivePerson,
    mostActiveCount,
    averageScore,
    peopleMostEvents,
    eventsPerMonth,
    eventsPerYear,
    personsWithEventsInMultipleYears,
    eventsByZodiac,
    eventsByActivity,
    personsByGender,
    eventsByGender,
    personsByAge,
    personsByFirstLetter,
    scoresByKisses,
    numberOfEventsByNumberOfPersons,
    scoredVsUnscored,
  }
}
