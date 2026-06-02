import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import FullscreenChartWrapper from "./FullscreenChartWrapper";

function ChartTooltip({ active, payload, tooltipUnit }) {
  const PALETTE = usePalette();
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const label = payload[0].payload?.label;
  const unit = tooltipUnit ? (value === 1 ? tooltipUnit.one : tooltipUnit.many) : null;
  return (
    <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.line}`, color: PALETTE.text, borderRadius: "0.5rem", padding: "0.5rem 0.75rem", fontSize: 13 }}>
      <p style={{ marginBottom: "0.2rem", fontWeight: 500 }}>{label}</p>
      <p>{`${value}${unit ? ` ${unit}` : ""}`}</p>
    </div>
  );
}

export default function RadarChartCard({ title, subtitle, data, emptyText, tooltipUnit = null }) {
  const PALETTE = usePalette();
  const cardStyle = { borderColor: PALETTE.cardBorder, backgroundColor: PALETTE.cardBg };
  const emptyStyle = { borderColor: PALETTE.inputBorder, color: PALETTE.textSoft };
  const hasData = data.some((d) => d.value > 0);

  return (
    <FullscreenChartWrapper>
    <Card className="rounded-3xl" style={{ boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", backdropFilter: "blur(8px)", ...cardStyle }}>
      <CardHeader style={{ paddingBottom: "0.5rem" }}>
        <CardTitle style={{ ...TEXT.title, color: PALETTE.text }}>{title}</CardTitle>
        <CardDescription style={{ color: PALETTE.textSoft }}>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div style={{ height: "18rem", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke={PALETTE.cardBorder} />
                <PolarAngleAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: PALETTE.textSoft }}
                />
                <PolarRadiusAxis
                  allowDecimals={false}
                  tick={{ fontSize: 9, fill: PALETTE.textSoft }}
                  tickCount={3}
                  axisLine={false}
                />
                {tooltipUnit ? (
                  <Tooltip content={<ChartTooltip tooltipUnit={tooltipUnit} />} />
                ) : (
                  <Tooltip />
                )}
                <Radar
                  dataKey="value"
                  stroke={PALETTE.accent}
                  fill={PALETTE.accent}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  dot={{ r: 3, fill: PALETTE.accent, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </RadarChart>
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
    </FullscreenChartWrapper>
  );
}
