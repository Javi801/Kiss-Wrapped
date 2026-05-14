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
import { PALETTE, CHART_COLORS, TEXT } from "@/lib/constants";
import { getColorForCategory } from "@/lib/format";

/**
 * Renders a reusable pie chart with legend.
 * It supports automatic color assignment and category-based colors.
 */
export default function PieChartCard({
  title,
  subtitle,
  data,
  emptyText,
}) {
  // Resolve colors for each slice.
  const fills = data.map(
    (entry, index) =>
      getColorForCategory(entry.label) ||
      CHART_COLORS[index % CHART_COLORS.length],
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
    <Card className="rounded-3xl" style={{ boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", backdropFilter: "blur(8px)", ...cardStyle }}>
      <CardHeader style={{ paddingBottom: "0.5rem" }}>
        <CardTitle style={{ ...TEXT.title, color: PALETTE.text }}>
          {title}
        </CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        {data.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflow: "hidden" }}>
            {/* Chart */}
            <div style={{ height: "14rem", width: "100%" }}>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", overflow: "hidden" }}>
              {data.map((entry, index) => (
                <div
                  key={entry.label}
                  className="rounded-full"
                  style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingLeft: "0.75rem", paddingRight: "0.75rem", paddingTop: "0.25rem", paddingBottom: "0.25rem", ...TEXT.caption, backgroundColor: "#f8f4f7", color: PALETTE.textSoft }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      className="rounded-full"
                      style={{ height: "0.625rem", width: "0.625rem", flexShrink: 0, backgroundColor: fills[index] }}
                    />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.label}: {entry.value}
                    </span>
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
