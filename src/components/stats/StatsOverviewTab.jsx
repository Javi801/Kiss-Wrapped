import { useMemo } from 'react'

import StatTile from '@/components/shared/StatTile'
import TopPersonTile from '@/components/shared/TopPersonTile'
import BarChartCard from '@/components/charts/BarChartCard'
import {
  getAverageEventsPerPerson,
  getAverageScore,
  getPeopleMostEvents,
  getTopPeople,
} from '@/lib/stats'

/**
 * Renders the overview tab for the stats screen.
 * It shows summary metrics and the top people by event count.
 */
export default function StatsOverviewTab({ people, allEvents, t }) {
  // Only the top entries (LIMITS.topPeopleCount) are shown in the chart.
  const peopleMostEvents = useMemo(() => getPeopleMostEvents(people), [people])

  // Calculate the average amount of events per saved person.
  const averageEventsPerPerson = getAverageEventsPerPerson(people, allEvents)

  // Find all people tied for the top position (at least 1 event).
  const topPeople = useMemo(() => getTopPeople(people), [people])

  // Calculate average score from scored events only.
  const averageScore = getAverageScore(allEvents)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '0.75rem',
        }}
      >
        <StatTile label={t.avgEvents} value={averageEventsPerPerson} helper={t.acrossAll} />
        <TopPersonTile
          label={topPeople.length > 1 ? t.topPersonPlural : t.topPerson}
          topPeople={topPeople}
          t={t}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '0.75rem',
        }}
      >
        <StatTile label={t.averageScore} value={averageScore} helper={t.scoreOutOf} />
        <StatTile label={t.totalEvents} value={allEvents.length} />
      </div>

      <BarChartCard
        title={t.peopleMostEvents}
        subtitle={t.topTracked}
        data={peopleMostEvents}
        emptyText={t.noDataYet}
        horizontal={true}
        tooltipUnit={{ one: t.chartEvent, many: t.chartEvents }}
      />
    </div>
  )
}
