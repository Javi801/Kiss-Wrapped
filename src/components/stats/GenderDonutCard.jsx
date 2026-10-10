import DonutCard from '@/components/charts/DonutCard'

export default function GenderDonutCard({ personsByGender, eventsByGender, emptyText, t }) {
  const eventsLabel = t.chartEvents.charAt(0).toUpperCase() + t.chartEvents.slice(1)
  const modes = {
    persons: {
      data: personsByGender,
      title: t.personsByGender,
      subtitle: t.genderSplit,
      label: t.peopleStats,
      tooltipUnit: { one: t.chartPerson, many: t.chartPersons },
    },
    events: {
      data: eventsByGender,
      title: t.eventsByGender,
      subtitle: t.eventsGenderSplit,
      label: eventsLabel,
      tooltipUnit: { one: t.chartEvent, many: t.chartEvents },
    },
  }

  return <DonutCard modes={modes} order={['persons', 'events']} emptyText={emptyText} />
}
