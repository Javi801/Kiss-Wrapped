import { useMemo } from "react";

import { SCORE_OPTIONS } from "@/lib/constants";
import { hasScore, renderKisses } from "@/lib/format";

import PieChartCard from "@/components/charts/PieChartCard";
import BarChartCard from "@/components/charts/BarChartCard";
import AreaChartCard from "@/components/charts/AreaChartCard";

/**
 * Renders the score-focused statistics tab.
 * It shows score distribution and event-count distribution.
 */
export default function StatsScoresTab({ people, allEvents, t }) {
  // Keep only events with a valid score.
  const scoredEvents = useMemo(
    () => allEvents.filter((event) => hasScore(event.score)),
    [allEvents],
  );

  /**
   * Groups scored events by kisses label.
   * All score buckets are initialized to keep output stable.
   */
  const scoresByKisses = useMemo(() => {
    const map = new Map();

    for (const score of SCORE_OPTIONS) {
      map.set(renderKisses(score, t), 0);
    }

    for (const event of scoredEvents) {
      const label = renderKisses(event.score, t);
      map.set(label, (map.get(label) || 0) + 1);
    }

    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }, [scoredEvents, t]);

  // Groups people by how many events they have.
  const numberOfEventsByNumberOfPersons = useMemo(() => {
    const map = new Map();

    for (const person of people) {
      const eventCount = person.events?.length || 0;
      map.set(String(eventCount), (map.get(String(eventCount)) || 0) + 1);
    }

    return [...map.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([label, value]) => ({ label, value }));
  }, [people]);

  // Compares scored events against unscored events.
  const scoredVsUnscored = useMemo(() => {
    const scored = allEvents.filter((event) => hasScore(event.score)).length;
    const unscored = allEvents.length - scored;

    return [
      { label: t.scores, value: scored },
      { label: t.noScore, value: unscored },
    ];
  }, [allEvents, t]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <PieChartCard
        title={t.scoreDistribution}
        subtitle={t.scoreDistributionDesc}
        data={scoredVsUnscored}
        emptyText={t.noDataYet}
        tooltipUnit={{ one: t.chartEvent, many: t.chartEvents }}
      />

      <BarChartCard
        title={t.scoreDistribution}
        subtitle={t.scoreDistributionDesc}
        data={scoresByKisses.filter((item) => item.value > 0)}
        emptyText={t.noDataYet}
        rotateXLabels={true}
        tooltipUnit={{ one: t.chartEvent, many: t.chartEvents }}
      />

      <AreaChartCard
        title={t.eventsByPersonCount}
        subtitle={t.eventCountBuckets}
        data={numberOfEventsByNumberOfPersons}
        emptyText={t.noDataYet}
        tooltipUnit={{ one: t.chartPerson, many: t.chartPersons }}
      />
    </div>
  );
}