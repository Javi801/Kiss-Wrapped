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
import { CHART_COLORS, TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";

/**
 * Renders a reusable bar chart card.
 * Supports optional label rotation and custom color mapping.
 */
function ChartTooltip({ active, payload, label, tooltipUnit }) {
  const PALETTE = usePalette();
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const unit = value === 1 ? tooltipUnit.one : tooltipUnit.many;
  return (
    <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.line}`, color: PALETTE.text, borderRadius: "0.5rem", padding: "0.5rem 0.75rem", fontSize: 13 }}>
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
  horizontal = false,
  customColors = null,
  yAxisLabel = null,
  tooltipUnit = null,
  headerAction = null,
  tabs = null,
  maxXTicks = null,
}) {
  const PALETTE = usePalette();
  const chartColors = PALETTE.chartColors ?? CHART_COLORS;
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

  // Equidistant tick labels for the X axis when maxXTicks is set and data exceeds the limit.
  const xTicks = maxXTicks && data.length > maxXTicks
    ? Array.from({ length: maxXTicks }, (_, i) =>
        data[Math.round(i * (data.length - 1) / (maxXTicks - 1))].label
      )
    : null;

  // Width for the category axis in horizontal mode, based on longest label.
  const labelAxisWidth = horizontal
    ? Math.min(Math.max(...data.map((d) => (d.label?.length ?? 0))) * 6 + 4, 80)
    : undefined;

  // Height scales with item count in horizontal mode so bars don't get too cramped.
  const chartHeight = horizontal ? Math.max(data.length * 36, 200) : 256;

  return (
    <Card className="rounded-3xl" style={{ boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", backdropFilter: "blur(8px)", ...cardStyle }}>
      <CardHeader style={{ paddingBottom: "0.5rem" }}>
        {headerAction ? (
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
            <div>
              <CardTitle style={{ ...TEXT.title, color: PALETTE.text }}>{title}</CardTitle>
              <CardDescription style={{ color: PALETTE.textSoft }}>{subtitle}</CardDescription>
            </div>
            {headerAction}
          </div>
        ) : (
          <>
            <CardTitle style={{ ...TEXT.title, color: PALETTE.text }}>{title}</CardTitle>
            <CardDescription style={{ color: PALETTE.textSoft }}>{subtitle}</CardDescription>
          </>
        )}
        {tabs}
      </CardHeader>

      <CardContent>
        {data.length ? (
          <div style={{ height: `${chartHeight}px`, width: "100%", outline: "none" }}>
            <ResponsiveContainer width="100%" height="100%">
              {horizontal ? (
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={PALETTE.cardBorder} />
                  <YAxis
                    dataKey="label"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tick={{ fill: PALETTE.textSoft }}
                    width={labelAxisWidth}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tick={{ fill: PALETTE.textSoft }}
                  />
                  {tooltipUnit ? (
                    <Tooltip cursor={{ fill: PALETTE.accentShadow }} content={<ChartTooltip tooltipUnit={tooltipUnit} />} />
                  ) : (
                    <Tooltip cursor={{ fill: PALETTE.accentShadow }} />
                  )}
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {data.map((entry, index) => {
                      const fill =
                        (customColors && customColors[entry.label]) ||
                        chartColors[index % chartColors.length];
                      return <Cell key={`${entry.label}-${index}`} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              ) : (
              <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                {/* Background grid */}
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={PALETTE.cardBorder} />

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
                  ticks={xTicks ?? undefined}
                  tick={{ fill: PALETTE.textSoft }}
                />

                {/* Y axis */}
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fill: PALETTE.textSoft }}
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
                  <Tooltip cursor={{ fill: PALETTE.accentShadow }} content={<ChartTooltip tooltipUnit={tooltipUnit} />} />
                ) : (
                  <Tooltip cursor={{ fill: PALETTE.accentShadow }} />
                )}

                {/* Bars */}
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => {
                    // Use custom color if provided, otherwise fallback to palette.
                    const fill =
                      (customColors && customColors[entry.label]) ||
                      chartColors[index % chartColors.length];

                    return (
                      <Cell key={`${entry.label}-${index}`} fill={fill} />
                    );
                  })}
                </Bar>
              </BarChart>
              )}
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
