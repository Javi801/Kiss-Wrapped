import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PALETTE, TEXT } from "@/lib/constants";

/**
 * Displays a boxplot-like visualization for age distribution.
 * It shows min, Q1, median, Q3, and max values.
 */
export default function AgeRangeBox({ title, subtitle, people, emptyText }) {
  // Extract valid numeric ages and sort them.
  const ages = people
    .map((p) => p.age)
    .filter((age) => Number.isFinite(age))
    .sort((a, b) => a - b);

  // Handle empty state when no valid ages exist.
  if (!ages.length) {
    return (
      <Card
        className="rounded-3xl"
        style={{ boxShadow: "none", borderColor: PALETTE.innerCardBorder, backgroundColor: PALETTE.cardSoft }}
      >
        <CardHeader style={{ paddingBottom: "0.5rem" }}>
          <CardTitle style={TEXT.title}>{title}</CardTitle>
          {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
        </CardHeader>

        <CardContent>
          <div
            className="rounded-2xl"
            style={{ border: `1px dashed ${PALETTE.inputBorder}`, padding: "1.5rem", textAlign: "center", ...TEXT.body, color: PALETTE.textSoft }}
          >
            {emptyText}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compute statistical values.
  const min = ages[0];
  const max = ages[ages.length - 1];
  const q1 = ages[Math.floor((ages.length - 1) * 0.25)];
  const median = ages[Math.floor((ages.length - 1) * 0.5)];
  const q3 = ages[Math.floor((ages.length - 1) * 0.75)];

  // Normalize positions for rendering.
  const scale = max - min || 1;
  const left = ((q1 - min) / scale) * 100;
  const width = ((q3 - q1) / scale) * 100;
  const medianPos = ((median - min) / scale) * 100;

  return (
    <Card
      className="rounded-3xl"
      style={{ boxShadow: "none", borderColor: PALETTE.innerCardBorder, backgroundColor: PALETTE.cardSoft }}
    >
      <CardHeader style={{ paddingBottom: "0.5rem" }}>
        <CardTitle style={TEXT.title}>{title}</CardTitle>
        <CardDescription>{subtitle || `${min} - ${max}`}</CardDescription>
      </CardHeader>

      <CardContent>
        <div
          className="rounded-3xl"
          style={{ padding: "1.25rem", backgroundColor: PALETTE.surfaceBg }}
        >
          {/* Labels row */}
          <div
            style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", ...TEXT.body, fontWeight: "500", color: PALETTE.deep }}
          >
            <span>{min}</span>
            <span>{q1}</span>
            <span>{median}</span>
            <span>{q3}</span>
            <span>{max}</span>
          </div>

          {/* Boxplot visualization */}
          <div style={{ position: "relative", height: "3.5rem" }}>
            {/* Base line */}
            <div
              style={{ position: "absolute", left: 0, right: 0, top: "50%", height: "0.125rem", transform: "translateY(-50%)", backgroundColor: "#e7d5de" }}
            />

            {/* Min marker */}
            <div
              style={{ position: "absolute", top: "50%", height: "2rem", width: "0.125rem", transform: "translateY(-50%)", left: "0%", backgroundColor: PALETTE.rose }}
            />

            {/* Max marker */}
            <div
              style={{ position: "absolute", top: "50%", height: "2rem", width: "0.125rem", transform: "translateY(-50%)", left: "100%", backgroundColor: PALETTE.rose }}
            />

            {/* IQR box */}
            <div
              className="rounded-sm"
              style={{
                position: "absolute",
                top: "50%",
                height: "2rem",
                transform: "translateY(-50%)",
                border: `2px solid ${PALETTE.rose}`,
                left: `${left}%`,
                width: `${Math.max(width, 2)}%`,
                borderColor: PALETTE.rose,
                backgroundColor: PALETTE.roseSoft,
              }}
            />

            {/* Median line */}
            <div
              style={{ position: "absolute", top: "50%", height: "2.5rem", width: "0.125rem", transform: "translateY(-50%)", left: `${medianPos}%`, backgroundColor: PALETTE.deep }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
