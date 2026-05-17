import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import BarChartCard from "@/components/charts/BarChartCard";
import DumbbellChartCard from "@/components/charts/DumbbellChartCard";
import HeatmapChartCard from "@/components/charts/HeatmapChartCard";
import { TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import { getMonthKey, getYearKey } from "@/lib/date";

// Renders the time-based statistics tab. It shows monthly, yearly, and multi-year event patterns.
export default function StatsTimeTab({ people, allEvents, t }) {
  const PALETTE = usePalette();
  // Groups all events by month. Keys are generated in yyyy-MM format.
  const eventsPerMonth = useMemo(() => {
    const map = new Map();

    for (const event of allEvents) {
      const key = getMonthKey(event.date);
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + 1);
    }

    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }));
  }, [allEvents]);

  // Groups all events by year. Keys are generated in yyyy format.
  const eventsPerYear = useMemo(() => {
    const map = new Map();

    for (const event of allEvents) {
      const key = getYearKey(event.date);
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + 1);
    }

    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }));
  }, [allEvents]);

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
      <BarChartCard
        title={t.eventsPerMonth}
        subtitle={t.monthlyActivity}
        data={eventsPerMonth}
        emptyText={t.noDataYet}
        rotateXLabels={true}
        tooltipUnit={{ one: t.chartEvent, many: t.chartEvents }}
      />

      <BarChartCard
        title={t.eventsPerYear}
        subtitle={t.yearlyTotals}
        data={eventsPerYear}
        emptyText={t.noDataYet}
        tooltipUnit={{ one: t.chartEvent, many: t.chartEvents }}
      />

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

      {personsWithEventsInMultipleYears.length ? (
        <Card
          className="rounded-3xl"
          style={{
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            backdropFilter: "blur(8px)",
            borderColor: PALETTE.cardBorder,
            backgroundColor: PALETTE.cardBg,
          }}
        >
          <CardHeader style={{ paddingBottom: "0.5rem" }}>
            <CardTitle style={{ ...TEXT.title, color: PALETTE.text }}>{t.multiYearSubtitle}</CardTitle>
            <CardDescription style={{ color: PALETTE.textSoft }}>{t.yearOverlap}</CardDescription>
          </CardHeader>

          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {personsWithEventsInMultipleYears.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl"
                  style={{ padding: "0.75rem", backgroundColor: PALETTE.cardSoft }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                    <span
                      style={{ fontWeight: "500", color: PALETTE.text }}
                    >
                      {item.label}
                    </span>

                    <Badge
                      className="rounded-full"
                      style={{ border: "none", color: "white", backgroundColor: PALETTE.accent }}
                    >
                      {item.value}
                    </Badge>
                  </div>

                  <p
                    style={{ marginTop: "0.25rem", ...TEXT.body, color: PALETTE.textSoft }}
                  >
                    {item.years.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
