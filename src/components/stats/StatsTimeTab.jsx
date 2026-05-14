import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import BarChartCard from "@/components/charts/BarChartCard";
import { PALETTE, TEXT } from "@/lib/constants";
import { getMonthKey, getYearKey } from "@/lib/date";

// Renders the time-based statistics tab. It shows monthly, yearly, and multi-year event patterns.
export default function StatsTimeTab({ people, allEvents, t }) {
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

  /**
   * Finds people whose events span two or more distinct years.
   * Each entry keeps both the count and the list of years.
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

          return { label: person.name, value: years.length, years };
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
      />

      <BarChartCard
        title={t.eventsPerYear}
        subtitle={t.yearlyTotals}
        data={eventsPerYear}
        emptyText={t.noDataYet}
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
            <CardTitle style={TEXT.title}>{t.multiYearSubtitle}</CardTitle>
            <CardDescription>{t.yearOverlap}</CardDescription>
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
                      style={{ border: "none", color: "white", backgroundColor: PALETTE.rose }}
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