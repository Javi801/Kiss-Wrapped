import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PALETTE, TEXT } from "@/lib/constants";
import AgeRangeBox from "@/components/stats/AgeRangeBox";
import { getYearKey } from "@/lib/date";

// Linear interpolation quantile (R-7 / numpy default).
function quantileFromSorted(sorted, p) {
  if (sorted.length === 1) return sorted[0];
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// Compute a nice axis with evenly-spaced ticks that encompass [dataMin, dataMax].
function niceAxis(dataMin, dataMax) {
  const dataRange = dataMax - dataMin;
  let step = 1;
  if (dataRange > 0) {
    const rawStep = dataRange / 4;
    if (rawStep <= 1) step = 1;
    else if (rawStep <= 2) step = 2;
    else if (rawStep <= 5) step = 5;
    else if (rawStep <= 10) step = 10;
    else step = Math.ceil(rawStep / 5) * 5;
  }
  const axisMin = Math.floor(dataMin / step) * step;
  const axisMax =
    Math.ceil(dataMax / step) * step === axisMin
      ? axisMin + step
      : Math.ceil(dataMax / step) * step;
  const axisRange = axisMax - axisMin;
  const tickValues = [];
  for (let v = axisMin; v <= axisMax; v += step) tickValues.push(v);
  const toPos = (v) => 3 + ((v - axisMin) / axisRange) * 94;
  return { tickValues, toPos };
}

export default function AgeRangeCard({ title, people, emptyText, t }) {
  const [splitByYear, setSplitByYear] = useState(false);

  const yearsData = useMemo(() => {
    const yearsMap = new Map();

    for (const person of people) {
      const years = [
        ...new Set(
          (person.events || [])
            .map((event) => getYearKey(event.date))
            .filter(Boolean),
        ),
      ];
      for (const year of years) {
        if (!yearsMap.has(year)) yearsMap.set(year, []);
        yearsMap.get(year).push(person);
      }
    }

    return [...yearsMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, yearPeople]) => ({
        year,
        people: Array.from(new Map(yearPeople.map((p) => [p.id, p])).values()),
      }));
  }, [people]);

  // Unique persons across all years.
  const combinedPeople = useMemo(
    () =>
      Array.from(
        new Map(
          yearsData.flatMap(({ people: yp }) => yp).map((p) => [p.id, p]),
        ).values(),
      ),
    [yearsData],
  );

  // Shared axis and per-year boxplot rows for the multi-year view.
  const multiYear = useMemo(() => {
    const allAges = combinedPeople
      .map((p) => p.age)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    if (!allAges.length) return null;

    const { tickValues, toPos } = niceAxis(allAges[0], allAges[allAges.length - 1]);

    const rows = yearsData
      .map(({ year, people: yp }) => {
        const sorted = yp.map((p) => p.age).filter(Number.isFinite).sort((a, b) => a - b);
        if (!sorted.length) return null;
        const q1 = quantileFromSorted(sorted, 0.25);
        const q3 = quantileFromSorted(sorted, 0.75);
        const boxLeft = toPos(q1);
        return {
          year,
          minPos: toPos(sorted[0]),
          maxPos: toPos(sorted[sorted.length - 1]),
          boxLeft,
          boxWidth: Math.max(toPos(q3) - boxLeft, 0.5),
          medianPos: toPos(quantileFromSorted(sorted, 0.5)),
        };
      })
      .filter(Boolean);

    return { tickValues, toPos, rows };
  }, [combinedPeople, yearsData]);

  return (
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
          <div>
            <CardTitle style={TEXT.title}>{title}</CardTitle>
            <CardDescription>
              {splitByYear ? t.divideByYear : t.allYears}
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.7)", borderColor: PALETTE.inputBorder }}
            onClick={() => setSplitByYear((prev) => !prev)}
          >
            {splitByYear ? t.showAllTogether : t.divideByYear}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!splitByYear ? (
          <AgeRangeBox
            title={title}
            subtitle={t.allYears}
            people={combinedPeople}
            emptyText={emptyText}
            bare
          />
        ) : multiYear && multiYear.rows.length ? (
          // Multi-year chart: shared X-axis, one boxplot row per year.
          <div className="rounded-3xl" style={{ padding: "1.25rem", backgroundColor: PALETTE.surfaceBg }}>
            {multiYear.rows.map(({ year, minPos, maxPos, boxLeft, boxWidth, medianPos }) => (
              <div
                key={year}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}
              >
                {/* Year label (Y-axis) */}
                <div
                  style={{
                    width: "2rem",
                    textAlign: "right",
                    flexShrink: 0,
                    ...TEXT.body,
                    fontWeight: "500",
                    color: PALETTE.textSoft,
                  }}
                >
                  {year}
                </div>

                {/* Boxplot row */}
                <div style={{ position: "relative", flex: 1, height: "2rem" }}>
                  <div
                    style={{ position: "absolute", left: "3%", right: "3%", top: "50%", height: "1px", transform: "translateY(-50%)", backgroundColor: "#e7d5de" }}
                  />
                  <div
                    style={{ position: "absolute", top: "50%", height: "1.25rem", width: "2px", transform: "translateY(-50%)", left: `${minPos}%`, backgroundColor: PALETTE.rose }}
                  />
                  <div
                    style={{ position: "absolute", top: "50%", height: "1.25rem", width: "2px", transform: "translateY(-50%)", left: `${maxPos}%`, backgroundColor: PALETTE.rose }}
                  />
                  <div
                    className="rounded-sm"
                    style={{
                      position: "absolute",
                      top: "50%",
                      height: "1.25rem",
                      transform: "translateY(-50%)",
                      border: `2px solid ${PALETTE.rose}`,
                      left: `${boxLeft}%`,
                      width: `${boxWidth}%`,
                      backgroundColor: PALETTE.roseSoft,
                    }}
                  />
                  <div
                    style={{ position: "absolute", top: "50%", height: "1.5rem", width: "2px", transform: "translateY(-50%)", left: `${medianPos}%`, backgroundColor: PALETTE.deep }}
                  />
                </div>
              </div>
            ))}

            {/* Shared X-axis labels */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{ width: "2rem", flexShrink: 0 }} />
              <div style={{ position: "relative", flex: 1, height: "1.25rem" }}>
                {multiYear.tickValues.map((v, i) => {
                  const pct = multiYear.toPos(v);
                  const isFirst = i === 0;
                  const isLast = i === multiYear.tickValues.length - 1;
                  return (
                    <span
                      key={v}
                      style={{
                        position: "absolute",
                        left: `${pct}%`,
                        transform: isFirst ? "none" : isLast ? "translateX(-100%)" : "translateX(-50%)",
                        ...TEXT.body,
                        fontWeight: "500",
                        color: PALETTE.deep,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {v}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl"
            style={{ border: `1px dashed ${PALETTE.inputBorder}`, padding: "2rem", textAlign: "center", ...TEXT.body, color: PALETTE.textSoft }}
          >
            {emptyText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
