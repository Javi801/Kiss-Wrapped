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
import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CHART_COLORS, TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import FullscreenChartWrapper from "./FullscreenChartWrapper";

const H_LABEL_VIEWPORT_W = 80;
const H_LABEL_CHAR_W = 7;
const H_ROW_H = 36;

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
  xAxisLabel = null,
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

  // Height scales with item count in horizontal mode so bars don't get too cramped.
  const chartHeight = horizontal ? Math.max(data.length * H_ROW_H, 200) : 256;

  // Horizontal mode: measure the card body so only the label column scrolls.
  const hChartRef = useRef(null);
  const [hContainerWidth, setHContainerWidth] = useState(0);
  useEffect(() => {
    const el = hChartRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setHContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const hPlotWidth = Math.max((hContainerWidth || 300) - H_LABEL_VIEWPORT_W, 220);
  const hLabelContentWidth = horizontal
    ? Math.max(
        H_LABEL_VIEWPORT_W,
        Math.max(...data.map((d) => (d.label?.length ?? 0)), 0) * H_LABEL_CHAR_W + 16,
      )
    : H_LABEL_VIEWPORT_W;
  const hRowHeight = data.length
    ? (chartHeight - 10) / data.length
    : H_ROW_H;

  return (
    <FullscreenChartWrapper>
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
          horizontal ? (
            <div
              ref={hChartRef}
              style={{
                display: "grid",
                gridTemplateColumns: `${H_LABEL_VIEWPORT_W}px minmax(0, 1fr)`,
                width: "100%",
              }}
            >
              <div
                style={{
                  height: chartHeight,
                  overflowX: "auto",
                  overflowY: "hidden",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <div
                  style={{
                    width: hLabelContentWidth,
                    height: chartHeight,
                    paddingTop: 5,
                    paddingBottom: 5,
                    boxSizing: "border-box",
                  }}
                >
                  {data.map((entry) => (
                    <div
                      key={entry.label}
                      title={entry.label}
                      style={{
                        height: hRowHeight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        paddingRight: 8,
                        boxSizing: "border-box",
                        color: PALETTE.textSoft,
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.label}
                    </div>
                  ))}
                </div>
              </div>
              <BarChart data={data} layout="vertical" width={hPlotWidth} height={chartHeight} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={PALETTE.cardBorder} />
                <YAxis
                  dataKey="label"
                  type="category"
                  hide
                  width={0}
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
            </div>
          ) : (
          <div style={{ height: `${chartHeight}px`, width: "100%", outline: "none" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={PALETTE.cardBorder} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  angle={rotateXLabels ? -24 : 0}
                  textAnchor={rotateXLabels ? "end" : "middle"}
                  height={rotateXLabels ? 62 : xAxisLabel ? 44 : 30}
                  interval={0}
                  ticks={xTicks ?? undefined}
                  tick={{ fill: PALETTE.textSoft }}
                  label={xAxisLabel ? {
                    value: xAxisLabel,
                    position: "insideBottom",
                    offset: 0,
                    style: { fontSize: 11, fill: PALETTE.textSoft },
                  } : undefined}
                />
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
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => {
                    const fill =
                      (customColors && customColors[entry.label]) ||
                      chartColors[index % chartColors.length];
                    return <Cell key={`${entry.label}-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          )
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
    </FullscreenChartWrapper>
  );
}
