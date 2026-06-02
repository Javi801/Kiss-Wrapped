import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import { calculateAge } from "@/lib/date";
import FullscreenChartWrapper from "@/components/charts/FullscreenChartWrapper";

/**
 * Displays a boxplot visualization for age distribution.
 * The x-axis uses "nice" rounded bounds so ticks are always evenly spaced.
 * When bare=true, renders only the chart content without the Card wrapper.
 */
export default function AgeRangeBox({ title, subtitle, people, emptyText, bare = false }) {
  const PALETTE = usePalette();
  const ages = useMemo(
    () => people
      .map((p) => calculateAge(p.birthYear, p.zodiacSign) ?? p.age)
      .filter((age) => Number.isFinite(age))
      .sort((a, b) => a - b),
    [people]
  );

  if (!ages.length) {
    const emptyContent = (
      <div
        className="rounded-2xl"
        style={{ border: `1px dashed ${PALETTE.inputBorder}`, padding: "1.5rem", textAlign: "center", ...TEXT.body, color: PALETTE.textSoft }}
      >
        {emptyText}
      </div>
    );

    if (bare) return emptyContent;

    return (
      <FullscreenChartWrapper>
      <Card
        className="rounded-3xl"
        style={{ boxShadow: "none", borderColor: PALETTE.innerCardBorder, backgroundColor: PALETTE.cardSoft }}
      >
        <CardHeader style={{ paddingBottom: "0.5rem" }}>
          <CardTitle style={{ ...TEXT.title, color: PALETTE.text }}>{title}</CardTitle>
          {subtitle ? <CardDescription style={{ color: PALETTE.textSoft }}>{subtitle}</CardDescription> : null}
        </CardHeader>
        <CardContent>{emptyContent}</CardContent>
      </Card>
      </FullscreenChartWrapper>
    );
  }

  // Linear interpolation quantile (R-7 / numpy default).
  function quantile(p) {
    if (ages.length === 1) return ages[0];
    const idx = p * (ages.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return ages[lo];
    return ages[lo] + (ages[hi] - ages[lo]) * (idx - lo);
  }

  const min = ages[0];
  const max = ages[ages.length - 1];
  const q1 = quantile(0.25);
  const median = quantile(0.5);
  const q3 = quantile(0.75);

  const axisMin = min;
  const axisMax = max;
  const axisRange = axisMax - axisMin;

  let tickValues;
  if (axisRange === 0) {
    tickValues = [min];
  } else {
    const count = Math.min(5, axisRange + 1);
    const raw = Array.from({ length: count }, (_, i) =>
      Math.round(axisMin + (axisRange * i) / (count - 1))
    );
    tickValues = [...new Set(raw)];
  }

  const toPos = axisRange === 0
    ? () => 50
    : (v) => 3 + ((v - axisMin) / axisRange) * 94;

  const minPos = toPos(min);
  const maxPos = toPos(max);
  const boxLeft = toPos(q1);
  const boxWidth = Math.max(toPos(q3) - boxLeft, 0.5);
  const medianPos = toPos(median);

  const chartContent = (
    <div className="rounded-3xl" style={{ padding: "1.25rem", backgroundColor: PALETTE.surfaceBg }}>
      {/* Boxplot */}
      <div style={{ position: "relative", height: "3.5rem", marginBottom: "0.75rem" }}>
        <div
          style={{ position: "absolute", left: "3%", right: "3%", top: "50%", height: "0.125rem", transform: "translateY(-50%)", backgroundColor: PALETTE.line }}
        />
        <div
          style={{ position: "absolute", top: "50%", height: "2rem", width: "0.125rem", transform: "translateY(-50%)", left: `${minPos}%`, backgroundColor: PALETTE.accent }}
        />
        <div
          style={{ position: "absolute", top: "50%", height: "2rem", width: "0.125rem", transform: "translateY(-50%)", left: `${maxPos}%`, backgroundColor: PALETTE.accent }}
        />
        <div
          className="rounded-sm"
          style={{
            position: "absolute",
            top: "50%",
            height: "2rem",
            transform: "translateY(-50%)",
            border: `2px solid ${PALETTE.accent}`,
            left: `${boxLeft}%`,
            width: `${boxWidth}%`,
            backgroundColor: PALETTE.accentSoft,
          }}
        />
        <div
          style={{ position: "absolute", top: "50%", height: "2.5rem", width: "0.125rem", transform: "translateY(-50%)", left: `${medianPos}%`, backgroundColor: PALETTE.accentEmphasis }}
        />
      </div>

      {/* X-axis labels */}
      <div style={{ position: "relative", height: "1.25rem" }}>
        {tickValues.map((v, i) => {
          const pct = toPos(v);
          const isFirst = i === 0;
          const isLast = i === tickValues.length - 1;
          return (
            <span
              key={v}
              style={{
                position: "absolute",
                left: `${pct}%`,
                transform: isFirst ? "none" : isLast ? "translateX(-100%)" : "translateX(-50%)",
                ...TEXT.body,
                fontWeight: "500",
                color: PALETTE.accentEmphasis,
                whiteSpace: "nowrap",
              }}
            >
              {v}
            </span>
          );
        })}
      </div>
    </div>
  );

  if (bare) return chartContent;

  return (
    <FullscreenChartWrapper>
    <Card
      className="rounded-3xl"
      style={{ boxShadow: "none", borderColor: PALETTE.innerCardBorder, backgroundColor: PALETTE.cardSoft }}
    >
      <CardHeader style={{ paddingBottom: "0.5rem" }}>
        <CardTitle style={{ ...TEXT.title, color: PALETTE.text }}>{title}</CardTitle>
        <CardDescription style={{ color: PALETTE.textSoft }}>{subtitle || `${min} - ${max}`}</CardDescription>
      </CardHeader>
      <CardContent>{chartContent}</CardContent>
    </Card>
    </FullscreenChartWrapper>
  );
}
