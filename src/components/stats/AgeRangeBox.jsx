import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PALETTE, TEXT } from "@/lib/constants";

/**
 * Displays a boxplot visualization for age distribution.
 * The x-axis uses "nice" rounded bounds so ticks are always evenly spaced.
 * When bare=true, renders only the chart content without the Card wrapper.
 */
export default function AgeRangeBox({ title, subtitle, people, emptyText, bare = false }) {
  const ages = people
    .map((p) => p.age)
    .filter((age) => Number.isFinite(age))
    .sort((a, b) => a - b);

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
      <Card
        className="rounded-3xl"
        style={{ boxShadow: "none", borderColor: PALETTE.innerCardBorder, backgroundColor: PALETTE.cardSoft }}
      >
        <CardHeader style={{ paddingBottom: "0.5rem" }}>
          <CardTitle style={TEXT.title}>{title}</CardTitle>
          {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
        </CardHeader>
        <CardContent>{emptyContent}</CardContent>
      </Card>
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

  // Compute a "nice" axis with evenly-spaced ticks that may extend beyond min/max.
  const dataRange = max - min;
  let step;
  if (dataRange === 0) {
    step = 1;
  } else {
    const rawStep = dataRange / 4;
    if (rawStep <= 1) step = 1;
    else if (rawStep <= 2) step = 2;
    else if (rawStep <= 5) step = 5;
    else if (rawStep <= 10) step = 10;
    else step = Math.ceil(rawStep / 5) * 5;
  }

  const axisMin = Math.floor(min / step) * step;
  const axisMax =
    Math.ceil(max / step) * step === axisMin
      ? axisMin + step
      : Math.ceil(max / step) * step;
  const axisRange = axisMax - axisMin;

  const tickValues = [];
  for (let v = axisMin; v <= axisMax; v += step) tickValues.push(v);

  const toPos = (v) => 3 + ((v - axisMin) / axisRange) * 94;

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
          style={{ position: "absolute", left: "3%", right: "3%", top: "50%", height: "0.125rem", transform: "translateY(-50%)", backgroundColor: "#e7d5de" }}
        />
        <div
          style={{ position: "absolute", top: "50%", height: "2rem", width: "0.125rem", transform: "translateY(-50%)", left: `${minPos}%`, backgroundColor: PALETTE.rose }}
        />
        <div
          style={{ position: "absolute", top: "50%", height: "2rem", width: "0.125rem", transform: "translateY(-50%)", left: `${maxPos}%`, backgroundColor: PALETTE.rose }}
        />
        <div
          className="rounded-sm"
          style={{
            position: "absolute",
            top: "50%",
            height: "2rem",
            transform: "translateY(-50%)",
            border: `2px solid ${PALETTE.rose}`,
            left: `${boxLeft}%`,
            width: `${boxWidth}%`,
            backgroundColor: PALETTE.roseSoft,
          }}
        />
        <div
          style={{ position: "absolute", top: "50%", height: "2.5rem", width: "0.125rem", transform: "translateY(-50%)", left: `${medianPos}%`, backgroundColor: PALETTE.deep }}
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
  );

  if (bare) return chartContent;

  return (
    <Card
      className="rounded-3xl"
      style={{ boxShadow: "none", borderColor: PALETTE.innerCardBorder, backgroundColor: PALETTE.cardSoft }}
    >
      <CardHeader style={{ paddingBottom: "0.5rem" }}>
        <CardTitle style={TEXT.title}>{title}</CardTitle>
        <CardDescription>{subtitle || `${min} - ${max}`}</CardDescription>
      </CardHeader>
      <CardContent>{chartContent}</CardContent>
    </Card>
  );
}
