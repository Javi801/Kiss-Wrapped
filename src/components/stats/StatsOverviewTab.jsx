import { useMemo } from "react";

import StatTile from "@/components/shared/StatTile";
import TopPersonTile from "@/components/shared/TopPersonTile";
import BarChartCard from "@/components/charts/BarChartCard";
import { hasScore } from "@/lib/format";

/**
 * Renders the overview tab for the stats screen.
 * It shows summary metrics and the top people by event count.
 */
export default function StatsOverviewTab({ people, allEvents, t }) {
  /**
   * Build the ranking of people with the most events.
   * Only the top 8 entries are shown in the chart.
   */
  const peopleMostEvents = useMemo(
    () =>
      [...people]
        .map((person) => ({
          label: person.name,
          value: person.events?.length || 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [people],
  );

  // Calculate the average amount of events per saved person.
  const averageEventsPerPerson = people.length
    ? (allEvents.length / people.length).toFixed(1)
    : "0.0";

  // Find all people tied for the top position (at least 1 event).
  const topPeople = useMemo(() => {
    const withEvents = [...people]
      .map((person) => ({ label: person.name, value: person.events?.length || 0 }))
      .filter((p) => p.value > 0)
      .sort((a, b) => b.value - a.value);
    if (!withEvents.length) return [];
    const max = withEvents[0].value;
    return withEvents.filter((p) => p.value === max);
  }, [people]);

  // Keep only events with a valid score for score metrics.
  const scoredEvents = allEvents.filter((event) => hasScore(event.score));

  // Calculate average score from scored events only.
  const averageScore = scoredEvents.length
    ? (
        scoredEvents.reduce((sum, event) => sum + event.score, 0) /
        scoredEvents.length
      ).toFixed(1)
    : "0.0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.75rem" }}>
        <StatTile
          label={t.avgEvents}
          value={averageEventsPerPerson}
          helper={t.acrossAll}
        />
        <TopPersonTile
          label={topPeople.length > 1 ? t.topPersonPlural : t.topPerson}
          topPeople={topPeople}
          t={t}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.75rem" }}>
        <StatTile
          label={t.averageScore}
          value={averageScore}
          helper={t.scores}
        />
        <StatTile
          label={t.totalEvents}
          value={allEvents.length}
          helper={t.statsGroupOverview}
        />
      </div>

      <BarChartCard
        title={t.peopleMostEvents}
        subtitle={t.topTracked}
        data={peopleMostEvents}
        emptyText={t.noDataYet}
        rotateXLabels={true}
        tooltipUnit={{ one: t.chartEvent, many: t.chartEvents }}
      />
    </div>
  );
}