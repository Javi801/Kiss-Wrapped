import DonutCard from '@/components/charts/DonutCard'

export default function ActivityDonutCard({ personsByActivity, eventsByActivity, emptyText, t }) {
  const eventsLabel = t.chartEvents.charAt(0).toUpperCase() + t.chartEvents.slice(1)
  const modes = {
    persons: {
      data: personsByActivity,
      title: t.personsByActivity,
      subtitle: t.activityDistribution,
      label: t.peopleStats,
      tooltipUnit: { one: t.chartPerson, many: t.chartPersons },
    },
    events: {
      data: eventsByActivity,
      title: t.eventsByActivity,
      subtitle: t.groupedByActivity,
      label: eventsLabel,
      tooltipUnit: { one: t.chartEvent, many: t.chartEvents },
    },
  }

  return <DonutCard modes={modes} order={['persons', 'events']} emptyText={emptyText} />
}
