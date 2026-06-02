import { useEffect, useMemo, useState } from "react";

import BarChartCard from "@/components/charts/BarChartCard";
import DumbbellChartCard from "@/components/charts/DumbbellChartCard";
import EventsTimelineChartCard from "@/components/charts/EventsTimelineChartCard";
import MultiYearTopCard from "@/components/charts/MultiYearTopCard";
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

          return {
            label: person.name,
            value: years.length,
            years,
            yearCounts,
            totalEvents: (person.events || []).length,
          };
        })
        .filter((item) => item.value >= 2)
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)),
    [people],
  );

  // Year range with no gaps, derived only from people who appear in multiple years.
  // Using allEvents would include years that only have single-appearance people,
  // leaving empty columns at the edges of the charts.
  const allYears = useMemo(() => {
    const nums = personsWithEventsInMultipleYears.flatMap((p) => p.years).map(Number);
    if (!nums.length) return [];
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    return Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
  }, [personsWithEventsInMultipleYears]);

  // Top 3 sorted by: most distinct years → most events → oldest event year → name.
  const top3MultiYear = useMemo(
    () =>
      [...personsWithEventsInMultipleYears]
        .sort(
          (a, b) =>
            b.value - a.value ||
            b.totalEvents - a.totalEvents ||
            (a.years[0] ?? "").localeCompare(b.years[0] ?? "") ||
            a.label.localeCompare(b.label),
        )
        .slice(0, 3),
    [personsWithEventsInMultipleYears],
  );

  // Histogram: how many people appear in exactly N distinct years (N = 2, 3, 4, ...).
  const yearCountDistribution = useMemo(() => {
    const counts = {};
    for (const item of personsWithEventsInMultipleYears) {
      counts[item.value] = (counts[item.value] || 0) + 1;
    }
    const keys = Object.keys(counts).map(Number);
    if (!keys.length) return [];
    const max = Math.max(...keys);
    return Array.from({ length: max - 1 }, (_, i) => ({
      label: String(i + 2),
      value: counts[i + 2] || 0,
    }));
  }, [personsWithEventsInMultipleYears]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <MultiYearTopCard top3={top3MultiYear} t={t} />

      <EventsTimelineChartCard allEvents={allEvents} t={t} />
      <PersonsTimelineChartCard people={people} t={t} />

      <BarChartCard
        title={t.multiYearPeople}
        subtitle={t.multiYearDesc}
        data={yearCountDistribution}
        emptyText={t.noMultiYearPeopleYet}
        yAxisLabel={t.chartPersons}
        xAxisLabel={t.years}
        tooltipUnit={{ one: t.chartPerson, many: t.chartPersons }}
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
