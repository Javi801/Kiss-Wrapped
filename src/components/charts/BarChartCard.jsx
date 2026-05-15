import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PALETTE, CHART_COLORS, TEXT } from "@/lib/constants";

/**
 * Renders a reusable bar chart card.
 * Supports optional label rotation and custom color mapping.
 */
function ChartTooltip({ active, payload, label, tooltipUnit }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const unit = value === 1 ? tooltipUnit.one : tooltipUnit.many;
  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", fontSize: 13 }}>
      <p style={{ marginBottom: "0.2rem", fontWeight: 500 }}>{label}</p>
      <p>{`${value} ${unit}`}</p>
    </div>
  );
}

export default function BarChartCard({
  title,
  subtitle,
  data,
  emptyText,
  rotateXLabels = false,
  customColors = null,
  yAxisLabel = null,
  tooltipUnit = null,
}) {
  // Shared container style for consistency across charts.
  const cardStyle = {
    borderColor: PALETTE.cardBorder,
    backgroundColor: PALETTE.cardBg,
  };

  // Empty state fallback when no data is available.
  const emptyStyle = {
    borderColor: PALETTE.inputBorder,
    color: PALETTE.textSoft,
  };

  return (
    <Card className="rounded-3xl" style={{ boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", backdropFilter: "blur(8px)", ...cardStyle }}>
      <CardHeader style={{ paddingBottom: "0.5rem" }}>
        <CardTitle style={{ ...TEXT.title, color: PALETTE.text }}>
          {title}
        </CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        {data.length ? (
          <div style={{ height: "16rem", width: "100%", outline: "none" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                {/* Background grid */}
                <CartesianGrid vertical={false} strokeDasharray="3 3" />

                {/* X axis with optional rotation */}
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  angle={rotateXLabels ? -24 : 0}
                  textAnchor={rotateXLabels ? "end" : "middle"}
                  height={rotateXLabels ? 62 : 30}
                  interval={0}
                />

                {/* Y axis */}
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={yAxisLabel ? 50 : 40}
                  label={yAxisLabel ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    dx: 15,
                    style: { fontSize: 11, fill: PALETTE.textSoft },
                  } : undefined}
                />

                {tooltipUnit ? (
                  <Tooltip content={<ChartTooltip tooltipUnit={tooltipUnit} />} />
                ) : (
                  <Tooltip />
                )}

                {/* Bars */}
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => {
                    // Use custom color if provided, otherwise fallback to palette.
                    const fill =
                      (customColors && customColors[entry.label]) ||
                      CHART_COLORS[index % CHART_COLORS.length];

                    return (
                      <Cell key={`${entry.label}-${index}`} fill={fill} />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
