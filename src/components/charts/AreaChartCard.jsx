import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PALETTE, TEXT } from "@/lib/constants";

/**
 * Renders a reusable area chart card.
 * It is used for time-based distributions or continuous data.
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

export default function AreaChartCard({
  title,
  subtitle,
  data,
  emptyText,
  tooltipUnit = null,
}) {
  // Shared card style for consistency.
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
              <AreaChart data={data}>
                {/* Grid lines */}
                <CartesianGrid vertical={false} strokeDasharray="3 3" />

                {/* X axis */}
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />

                {/* Y axis */}
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />

                {tooltipUnit ? (
                  <Tooltip content={<ChartTooltip tooltipUnit={tooltipUnit} />} />
                ) : (
                  <Tooltip />
                )}

                {/* Area */}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={PALETTE.sky2}
                  fill={PALETTE.sky}
                />
              </AreaChart>
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
