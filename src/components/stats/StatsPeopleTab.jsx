import { useMemo, useState } from 'react'

import { usePalette } from '@/lib/theme'
import {
  countEvents,
  countPeople,
  getEventCountDistribution,
  getPersonsByAge,
  getPersonsByAgeAtEvent,
  getPersonsByFirstLetter,
  groupByActivity,
  groupByGender,
  groupByZodiac,
} from '@/lib/stats'

import BarChartCard from '@/components/charts/BarChartCard'
import AreaChartCard from '@/components/charts/AreaChartCard'
import AgeRangeCard from '@/components/stats/AgeRangeCard'
import ActivityDonutCard from '@/components/stats/ActivityDonutCard'
import GenderDonutCard from '@/components/stats/GenderDonutCard'
import ZodiacRadarCard from '@/components/stats/ZodiacRadarCard'

/**
 * Renders the people-focused statistics tab.
 * It groups event and person data by zodiac, activity, gender, age, and name initials.
 * Person counts include everyone; event sums only use `eventPeople` (partners excluded).
 */
export default function StatsPeopleTab({ people, eventPeople = people, t, language }) {
  const PALETTE = usePalette()
  const [ageAtEvent, setAgeAtEvent] = useState(false)

  // Counts people per zodiac sign, filling in zeros for all 12 signs.
  const personsByZodiac = useMemo(
    () => groupByZodiac(people, language, countPeople, { allSigns: true }),
    [people, language]
  )

  // Counts people per translated activity label.
  const personsByActivity = useMemo(() => groupByActivity(people, t), [people, t])

  // Sums total events by zodiac sign keeping all 12 signs in zodiac order (for radar chart).
  const eventsByZodiacOrdered = useMemo(
    () => groupByZodiac(eventPeople, language, countEvents, { allSigns: true }),
    [eventPeople, language]
  )

  // Sums total events by translated activity label.
  const eventsByActivity = useMemo(
    () => groupByActivity(eventPeople, t, countEvents),
    [eventPeople, t]
  )

  // Counts how many people belong to each gender.
  const personsByGender = useMemo(() => groupByGender(people, t), [people, t])

  // Sums total events by gender.
  const eventsByGender = useMemo(() => groupByGender(eventPeople, t, countEvents), [eventPeople, t])

  // Counts how many people exist for each age (current age).
  const personsByAge = useMemo(() => getPersonsByAge(people), [people])

  // Counts how many people were at each age at the time of their events.
  const personsByAgeAtEvent = useMemo(() => getPersonsByAgeAtEvent(people), [people])

  // Counts people grouped by the first letter of their name.
  const personsByFirstLetter = useMemo(() => getPersonsByFirstLetter(people), [people])

  // Groups people by how many events they have.
  const numberOfEventsByNumberOfPersons = useMemo(
    () => getEventCountDistribution(eventPeople, { fillGaps: true }),
    [eventPeople]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <BarChartCard
        title={t.personsByFirstLetter}
        subtitle={t.firstLetterDist}
        data={personsByFirstLetter}
        emptyText={t.noDataYet}
        tooltipUnit={{ one: t.chartPerson, many: t.chartPersons }}
        showAllTicks
      />

      <ZodiacRadarCard
        personsByZodiac={personsByZodiac}
        eventsByZodiac={eventsByZodiacOrdered}
        emptyText={t.noDataYet}
        t={t}
      />

      <ActivityDonutCard
        personsByActivity={personsByActivity}
        eventsByActivity={eventsByActivity}
        emptyText={t.noDataYet}
        t={t}
      />

      <GenderDonutCard
        personsByGender={personsByGender}
        eventsByGender={eventsByGender}
        emptyText={t.noDataYet}
        t={t}
      />

      <BarChartCard
        title={t.personsByAge}
        subtitle={ageAtEvent ? t.ageAtEventDesc : t.ageDistribution}
        data={ageAtEvent ? personsByAgeAtEvent : personsByAge}
        emptyText={t.noDataYet}
        tooltipUnit={{ one: t.chartPerson, many: t.chartPersons }}
        tabs={
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              padding: '0.25rem',
              background: PALETTE.accentMuted,
              borderRadius: '0.875rem',
              marginTop: '0.5rem',
            }}
          >
            {[
              { label: t.ageCurrent, value: false },
              { label: t.ageAtEvent, value: true },
            ].map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setAgeAtEvent(value)}
                style={{
                  flex: 1,
                  padding: '0.3rem 0',
                  borderRadius: '0.625rem',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: ageAtEvent === value ? 600 : 400,
                  background:
                    ageAtEvent === value
                      ? `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`
                      : 'transparent',
                  color: ageAtEvent === value ? 'white' : PALETTE.textSoft,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      <AgeRangeCard title={t.boxplotAgeRange} people={people} emptyText={t.noDataYet} t={t} />

      <AreaChartCard
        title={t.eventsByPersonCount}
        subtitle={t.eventCountBuckets}
        data={numberOfEventsByNumberOfPersons}
        emptyText={t.noDataYet}
        tooltipUnit={{ one: t.chartPerson, many: t.chartPersons }}
      />
    </div>
  )
}
