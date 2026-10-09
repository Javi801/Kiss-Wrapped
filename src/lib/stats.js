import { SCORE_OPTIONS, ZODIAC_OPTIONS } from '@/lib/constants'
import { DEFAULT_SETTINGS, LIMITS } from '@/lib/config'
import {
  hasScore,
  renderKisses,
  getShortZodiacLabel,
  getZodiacForLanguage,
  translateActivity,
  translateGender,
} from '@/lib/format'
import { getMonthKey, getYearKey, effectiveAge, effectiveAgeAtEvent } from '@/lib/date'

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
 * Returns the partner period of a person, or null when they were never a partner.
 * Bounds are yyyy.MM.dd strings; a null bound is open (current partners have no end).
 */
export function getPartnerPeriod(person) {
  if (person.partnerStatus === 'current') return { from: person.partnerFrom || null, to: null }
  if (person.partnerStatus === 'past')
    return { from: person.partnerFrom || null, to: person.partnerTo || null }
  return null
}

/**
 * Whether an event date falls inside a partner period (inclusive bounds).
 * Dates are yyyy.MM.dd strings, so string comparison is safe.
 */
export function isInPartnerPeriod(date, period) {
  if (!period) return false
  if (period.from && (!date || date < period.from)) return false
  if (period.to && (!date || date > period.to)) return false
  return true
}

/**
 * Returns the people that count towards event-based statistics.
 * Events inside a partner period are removed; events outside it still count.
 * People whose partner period covers all of their events are dropped entirely,
 * so they don't dilute averages or show up as zero-event entries.
 * Partners always stay in person-based statistics (use the unfiltered list there).
 */
export function excludePartnerEvents(people) {
  const result = []
  for (const person of people) {
    const period = getPartnerPeriod(person)
    if (!period) {
      result.push(person)
      continue
    }
    const events = (person.events || []).filter((event) => !isInPartnerPeriod(event.date, period))
    if (events.length > 0) result.push({ ...person, events })
  }
  return result
}

// Weights for the group* helpers: count each person once, or by their number of events.
export const countPeople = () => 1
export const countEvents = (person) => person.events?.length || 0

// Adds up a weight per key. Items whose key is null are skipped.
function tally(items, getKey, getWeight = countPeople) {
  const map = new Map()
  for (const item of items) {
    const key = getKey(item)
    if (key == null) continue
    map.set(key, (map.get(key) || 0) + getWeight(item))
  }
  return map
}

// Converts a tally into chart rows.
function toRows(map) {
  return [...map.entries()].map(([label, value]) => ({ label, value }))
}

// Converts a tally keyed by integers into chart rows covering every integer from min to max.
function toRangeRows(map, min = Math.min(...map.keys())) {
  if (!map.size) return []
  const max = Math.max(...map.keys())
  return Array.from({ length: max - min + 1 }, (_, i) => ({
    label: String(min + i),
    value: map.get(min + i) || 0,
  }))
}

const byValueDesc = (a, b) => b.value - a.value
const byLabel = (a, b) => a.label.localeCompare(b.label)

/**
 * Flattens every event keeping a reference to the person it belongs to.
 */
export function flattenEvents(people) {
  return people.flatMap((person) => (person.events || []).map((event) => ({ ...event, person })))
}

/**
 * Keeps only the events with a valid score.
 */
export function getScoredEvents(allEvents) {
  return allEvents.filter((event) => hasScore(event.score))
}

/**
 * Average score over scored events only, as a one-decimal string.
 */
export function getAverageScore(allEvents) {
  const scoredEvents = getScoredEvents(allEvents)
  return scoredEvents.length
    ? (scoredEvents.reduce((sum, event) => sum + event.score, 0) / scoredEvents.length).toFixed(1)
    : '0.0'
}

/**
 * Average number of events per person, as a one-decimal string.
 */
export function getAverageEventsPerPerson(people, allEvents) {
  return people.length ? (allEvents.length / people.length).toFixed(1) : '0.0'
}

// Everyone as { label, value } rows, most events first.
function rankPeopleByEvents(people) {
  return people
    .map((person) => ({ label: person.name, value: countEvents(person) }))
    .sort(byValueDesc)
}

/**
 * Ranking of people with the most events, capped at LIMITS.topPeopleCount.
 */
export function getPeopleMostEvents(people) {
  return rankPeopleByEvents(people).slice(0, LIMITS.topPeopleCount)
}

/**
 * Everyone tied for the top position. People without events never qualify.
 */
export function getTopPeople(people) {
  const ranked = rankPeopleByEvents(people).filter((item) => item.value > 0)
  if (!ranked.length) return []
  return ranked.filter((item) => item.value === ranked[0].value)
}

/**
 * People whose events span two or more distinct years.
 * yearCounts maps each year string to the number of events that year.
 */
export function getPeopleInMultipleYears(people) {
  return people
    .map((person) => {
      const yearCounts = Object.fromEntries(
        tally(person.events || [], (event) => getYearKey(event.date))
      )
      const years = Object.keys(yearCounts).sort()
      return {
        label: person.name,
        value: years.length,
        years,
        yearCounts,
        totalEvents: countEvents(person),
      }
    })
    .filter((item) => item.value >= 2)
    .sort((a, b) => byValueDesc(a, b) || byLabel(a, b))
}

/**
 * Groups people by zodiac sign, merging signs stored in different languages.
 * By default only the signs present are returned, highest value first; with
 * `allSigns` the 12 signs come back in zodiac order, zeros included.
 */
export function groupByZodiac(
  people,
  language = DEFAULT_SETTINGS.language,
  weight = countPeople,
  { allSigns = false } = {}
) {
  const map = tally(
    people,
    (person) => getShortZodiacLabel(getZodiacForLanguage(person.zodiacSign, language)),
    weight
  )
  if (!allSigns) return toRows(map).sort(byValueDesc)
  return ZODIAC_OPTIONS[language]
    .map(getShortZodiacLabel)
    .map((label) => ({ label, value: map.get(label) || 0 }))
}

/**
 * Groups people by translated activity label, highest value first.
 */
export function groupByActivity(people, t, weight = countPeople) {
  return toRows(tally(people, (person) => translateActivity(person.activity, t), weight)).sort(
    byValueDesc
  )
}

/**
 * Groups people by translated gender label.
 */
export function groupByGender(people, t, weight = countPeople) {
  return toRows(tally(people, (person) => translateGender(person.gender, t), weight))
}

// Returns the age only when it is a usable number.
const finiteOrNull = (age) => (Number.isFinite(age) ? age : null)

/**
 * Counts people per current age, filling zeros for the full min–max range.
 */
export function getPersonsByAge(people) {
  return toRangeRows(tally(people, (person) => finiteOrNull(effectiveAge(person))))
}

/**
 * Counts people per age they had at their events, filling zeros for the full min–max range.
 * A person contributes 1 to each distinct age they appeared at across all events.
 */
export function getPersonsByAgeAtEvent(people) {
  const agesSeen = people.flatMap((person) => [
    ...new Set(
      (person.events || [])
        .map((event) => finiteOrNull(effectiveAgeAtEvent(person, event.date)))
        .filter((age) => age != null)
    ),
  ])
  return toRangeRows(tally(agesSeen, (age) => age))
}

const SPANISH_ALPHABET = [...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ']

/**
 * Counts people by the first letter of their name, in Spanish alphabet order.
 * Anything outside the alphabet (or a missing name) falls under '#'.
 */
export function getPersonsByFirstLetter(people) {
  const map = tally(people, (person) => {
    const first = person.name?.[0]?.toUpperCase()
    return SPANISH_ALPHABET.includes(first) ? first : '#'
  })
  const order = [...SPANISH_ALPHABET, '#']
  return toRows(map).sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label))
}

/**
 * Counts people by how many events they have, lowest count first.
 * `fillGaps` adds a zero row for every missing integer from 0 to max.
 */
export function getEventCountDistribution(people, { fillGaps = false } = {}) {
  const map = tally(people, countEvents)
  if (fillGaps) return toRangeRows(map, 0)
  return toRows(map)
    .sort((a, b) => a.label - b.label)
    .map(({ label, value }) => ({ label: String(label), value }))
}

/**
 * Counts scored events per kisses label, with every score bucket pre-seeded at 0.
 * `includeZero: false` leaves the zero-kiss score out of the distribution.
 */
export function getScoresByKisses(allEvents, t, { includeZero = true } = {}) {
  const counts = (score) => includeZero || score > 0
  const map = new Map(SCORE_OPTIONS.filter(counts).map((score) => [renderKisses(score, t), 0]))
  for (const event of getScoredEvents(allEvents)) {
    if (!counts(event.score)) continue
    const label = renderKisses(event.score, t)
    map.set(label, (map.get(label) || 0) + 1)
  }
  return toRows(map)
}

/**
 * Compares scored events against events without a valid score.
 */
export function getScoredVsUnscored(allEvents, t) {
  const scored = getScoredEvents(allEvents).length
  return [
    { label: t.scores, value: scored },
    { label: t.noScore, value: allEvents.length - scored },
  ]
}

/**
 * Builds the derived statistics used by the PDF export.
 * It composes the same aggregation helpers the stats tabs call.
 * Event-based aggregations skip events inside partner periods; person-based
 * aggregations (gender, age, first letter) use everyone.
 */
export function getStatsData(people, t, language = DEFAULT_SETTINGS.language) {
  const eventPeople = excludePartnerEvents(people)
  const allEvents = flattenEvents(eventPeople)
  const peopleMostEvents = getPeopleMostEvents(eventPeople)

  return {
    allEvents,
    averageEventsPerPerson: getAverageEventsPerPerson(eventPeople, allEvents),
    mostActivePerson: peopleMostEvents[0]?.label || '—',
    mostActiveCount: peopleMostEvents[0]?.value || 0,
    averageScore: getAverageScore(allEvents),
    peopleMostEvents,
    // Month keys are yyyy-MM and year keys yyyy, so sorting by label is chronological.
    eventsPerMonth: toRows(tally(allEvents, (event) => getMonthKey(event.date))).sort(byLabel),
    eventsPerYear: toRows(tally(allEvents, (event) => getYearKey(event.date))).sort(byLabel),
    personsWithEventsInMultipleYears: getPeopleInMultipleYears(eventPeople),
    eventsByZodiac: groupByZodiac(eventPeople, language, countEvents),
    eventsByActivity: groupByActivity(eventPeople, t, countEvents),
    personsByGender: groupByGender(people, t),
    eventsByGender: groupByGender(eventPeople, t, countEvents),
    personsByAge: getPersonsByAge(people),
    personsByFirstLetter: getPersonsByFirstLetter(people),
    scoresByKisses: getScoresByKisses(allEvents, t),
    numberOfEventsByNumberOfPersons: getEventCountDistribution(eventPeople),
    scoredVsUnscored: getScoredVsUnscored(allEvents, t),
  }
}
