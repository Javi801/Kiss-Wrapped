import { useMemo } from "react";

import StatTile from "@/components/shared/StatTile";
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

  // Read the first ranked person for the summary tile.
  const mostActivePerson = peopleMostEvents[0]?.label || "—";
  const mostActiveCount = peopleMostEvents[0]?.value || 0;

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
        <StatTile
          label={t.topPerson}
          value={mostActiveCount}
          helper={mostActivePerson}
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
      />
    </div>
  );
}