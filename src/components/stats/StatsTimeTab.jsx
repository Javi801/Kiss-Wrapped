import { useEffect, useMemo, useState } from "react";

import BarChartCard from "@/components/charts/BarChartCard";
import DumbbellChartCard from "@/components/charts/DumbbellChartCard";
import EventsTimelineChartCard from "@/components/charts/EventsTimelineChartCard";
import PersonsTimelineChartCard from "@/components/charts/PersonsTimelineChartCard";
import HeatmapChartCard from "@/components/charts/HeatmapChartCard";
import { getYearKey } from "@/lib/date";

// Renders the time-based statistics tab. It shows monthly, yearly, and multi-year event patterns.
export default function StatsTimeTab({ people, allEvents, t }) {
  // Defer the two heaviest charts (Dumbbell + Heatmap) to a subsequent frame
  // so the first paint shows the lighter charts without blocking.
  const [showDeferred, setShowDeferred] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShowDeferred(true), 60);
    return () => clearTimeout(id);
  }, []);

  // Full year range with no gaps, derived from all events across all people.
  const allYears = useMemo(() => {
    const nums = allEvents
      .map((e) => getYearKey(e.date))
      .filter(Boolean)
      .map(Number);
    if (!nums.length) return [];
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    return Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
  }, [allEvents]);

  /**
   * People whose events span two or more distinct years.
   * yearCounts maps each year string to the number of events that year.
   */
  const personsWithEventsInMultipleYears = useMemo(
    () =>
      people
        .map((person) => {
          const years = [
            ...new Set(
              (person.events || [])
                .map((event) => getYearKey(event.date))
                .filter(Boolean),
            ),
          ].sort();

          const yearCounts = {};
          for (const event of person.events || []) {
            const y = getYearKey(event.date);
            if (y) yearCounts[y] = (yearCounts[y] || 0) + 1;
          }

          return { label: person.name, value: years.length, years, yearCounts };
        })
        .filter((item) => item.value >= 2)
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)),
    [people],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <EventsTimelineChartCard allEvents={allEvents} t={t} />
      <PersonsTimelineChartCard people={people} t={t} />

      <BarChartCard
        title={t.multiYearPeople}
        subtitle={t.multiYearDesc}
        data={personsWithEventsInMultipleYears.map((item) => ({
          label: item.label,
          value: item.value,
        }))}
        emptyText={t.noMultiYearPeopleYet}
        rotateXLabels={true}
        yAxisLabel={t.years}
        tooltipUnit={{ one: t.chartYear, many: t.years }}
      />

      {showDeferred && (
        <>
          <DumbbellChartCard
            title={t.dumbbellChart}
            subtitle={t.dumbbellDesc}
            data={personsWithEventsInMultipleYears}
            allYears={allYears}
            emptyText={t.noMultiYearPeopleYet}
          />

          <HeatmapChartCard
            title={t.heatmapChart}
            subtitle={t.heatmapDesc}
            data={personsWithEventsInMultipleYears}
            allYears={allYears}
            emptyText={t.noMultiYearPeopleYet}
          />
        </>
      )}
    </div>
  );
}
