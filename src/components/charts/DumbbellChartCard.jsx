import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";

const MARGIN_TOP = 28;
const MARGIN_RIGHT = 16;
const MARGIN_BOTTOM = 8;
const APPROX_CHAR_PX = 6;
const MIN_DATA_W = 80;
const ROW_H = 44;
const DOT_R = 4;

export default function DumbbellChartCard({ title, subtitle, data, allYears, emptyText }) {
  const PALETTE = usePalette();
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(300);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Left margin grows with the longest name so no text is ever clipped.
  const longestName = data.length ? Math.max(...data.map((d) => d.label.length)) : 10;
  const marginLeft = Math.max(80, longestName * APPROX_CHAR_PX + 16);

  // SVG is at least as wide as the container; if names push it wider, overflow-x kicks in.
  const svgWidth = Math.max(containerWidth, marginLeft + MIN_DATA_W + MARGIN_RIGHT);
  const chartW = svgWidth - marginLeft - MARGIN_RIGHT;
  const chartH = data.length * ROW_H;
  const svgH = MARGIN_TOP + chartH + MARGIN_BOTTOM;
  const numYears = allYears.length;

  const xForYear = (year) => {
    if (numYears <= 1) return marginLeft + chartW / 2;
    const idx = allYears.indexOf(year);
    return marginLeft + idx * (chartW / (numYears - 1));
  };

  const yForRow = (i) => MARGIN_TOP + i * ROW_H + ROW_H / 2;

  const cardStyle = { borderColor: PALETTE.cardBorder, backgroundColor: PALETTE.cardBg };
  const emptyStyle = { borderColor: PALETTE.inputBorder, color: PALETTE.textSoft };

  return (
    <Card
      className="rounded-3xl"
      style={{ boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", backdropFilter: "blur(8px)", ...cardStyle }}
    >
      <CardHeader style={{ paddingBottom: "0.5rem" }}>
        <CardTitle style={{ ...TEXT.title, color: PALETTE.text }}>{title}</CardTitle>
        <CardDescription style={{ color: PALETTE.textSoft }}>{subtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        {data.length && allYears.length ? (
          <div ref={containerRef}>
            <div style={{ overflowX: "auto" }}>
            <svg width={svgWidth} height={svgH} aria-hidden="true">
              {/* Year labels on X axis */}
              {allYears.map((year) => (
                <text
                  key={year}
                  x={xForYear(year)}
                  y={MARGIN_TOP - 10}
                  textAnchor="middle"
                  fontSize={11}
                  fill={PALETTE.textSoft}
                >
                  {year}
                </text>
              ))}

              {/* Vertical grid lines */}
              {allYears.map((year) => (
                <line
                  key={year}
                  x1={xForYear(year)}
                  y1={MARGIN_TOP - 4}
                  x2={xForYear(year)}
                  y2={MARGIN_TOP + chartH}
                  stroke={PALETTE.cardBorder}
                  strokeWidth={1}
                />
              ))}

              {/* Horizontal row dividers */}
              {data.map((_, i) => (
                <line
                  key={i}
                  x1={marginLeft}
                  y1={MARGIN_TOP + i * ROW_H}
                  x2={svgWidth - MARGIN_RIGHT}
                  y2={MARGIN_TOP + i * ROW_H}
                  stroke={PALETTE.cardBorder}
                  strokeWidth={0.5}
                  strokeDasharray="3 3"
                />
              ))}

              {/* Per-person rows */}
              {data.map((person, i) => {
                const cy = yForRow(i);
                const sortedYears = [...person.years].sort();

                return (
                  <g key={person.label}>
                    {/* Name label */}
                    <text
                      x={marginLeft - 8}
                      y={cy + 4}
                      textAnchor="end"
                      fontSize={12}
                      fill={PALETTE.text}
                    >
                      {person.label}
                    </text>

                    {/* Lines connecting consecutive years */}
                    {sortedYears.map((year, j) => {
                      if (j === 0) return null;
                      const prev = sortedYears[j - 1];
                      if (Number(year) - Number(prev) !== 1) return null;
                      return (
                        <line
                          key={`${prev}-${year}`}
                          x1={xForYear(prev)}
                          y1={cy}
                          x2={xForYear(year)}
                          y2={cy}
                          stroke={PALETTE.accent}
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                      );
                    })}

                    {/* Dot per active year */}
                    {sortedYears.map((year) => (
                      <circle
                        key={year}
                        cx={xForYear(year)}
                        cy={cy}
                        r={DOT_R}
                        fill={PALETTE.accent}
                        stroke={PALETTE.card}
                        strokeWidth={2}
                      />
                    ))}
                  </g>
                );
              })}
            </svg>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl"
            style={{
              border: "1px dashed",
              padding: "2rem",
              textAlign: "center",
              ...TEXT.body,
              ...emptyStyle,
            }}
          >
            {emptyText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
