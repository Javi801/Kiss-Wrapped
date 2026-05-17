import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CHART_COLORS, TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import { getColorForCategory } from "@/lib/format";

/**
 * Renders a reusable pie chart with legend.
 * It supports automatic color assignment and category-based colors.
 */
function ChartTooltip({ active, payload, tooltipUnit }) {
  const PALETTE = usePalette();
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const label = payload[0].name;
  const unit = value === 1 ? tooltipUnit.one : tooltipUnit.many;
  return (
    <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.line}`, color: PALETTE.text, borderRadius: "0.5rem", padding: "0.5rem 0.75rem", fontSize: 13 }}>
      <p style={{ marginBottom: "0.2rem", fontWeight: 500 }}>{label}</p>
      <p>{`${value} ${unit}`}</p>
    </div>
  );
}

export default function PieChartCard({
  title,
  subtitle,
  data,
  emptyText,
  tooltipUnit = null,
}) {
  const PALETTE = usePalette();
  const chartColors = PALETTE.chartColors ?? CHART_COLORS;
  // Resolve colors for each slice.
  const fills = data.map(
    (entry, index) =>
      getColorForCategory(entry.label) ||
      chartColors[index % chartColors.length],
  );

  // Shared card styling.
  const cardStyle = {
    borderColor: PALETTE.cardBorder,
    backgroundColor: PALETTE.cardBg,
  };

  // Empty state styling.
  const emptyStyle = {
    borderColor: PALETTE.inputBorder,
    color: PALETTE.textSoft,
  };

  return (
    <Card className="rounded-3xl overflow-visible" style={{ boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", backdropFilter: "blur(8px)", ...cardStyle }}>
      <CardHeader style={{ paddingBottom: "0.5rem" }}>
        <CardTitle style={{ ...TEXT.title, color: PALETTE.text }}>
          {title}
        </CardTitle>
        <CardDescription style={{ color: PALETTE.textSoft }}>{subtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        {data.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* Chart */}
            <div style={{ height: "14rem", width: "100%", outline: "none" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {data.map((entry, index) => (
                      <Cell key={entry.label} fill={fills[index]} />
                    ))}
                  </Pie>
                  {tooltipUnit ? (
                    <Tooltip content={<ChartTooltip tooltipUnit={tooltipUnit} />} />
                  ) : (
                    <Tooltip />
                  )}
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(9rem, 100%), 1fr))",
                gap: "0.5rem",
              }}
            >
              {data.map((entry, index) => (
                <div
                  key={entry.label}
                  className="rounded-xl"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    minWidth: 0,
                    paddingLeft: "0.75rem",
                    paddingRight: "0.75rem",
                    paddingTop: "0.375rem",
                    paddingBottom: "0.375rem",
                    ...TEXT.caption,
                    backgroundColor: PALETTE.cardSoft,
                    color: PALETTE.textSoft,
                  }}
                >
                  <span
                    className="rounded-full"
                    style={{ height: "0.625rem", width: "0.625rem", flexShrink: 0, marginTop: "0.1875rem", backgroundColor: fills[index] }}
                  />
                  <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    {entry.label}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl"
            style={{ border: "1px dashed", padding: "2rem", textAlign: "center", ...TEXT.body, ...emptyStyle }}
          >
            {emptyText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
