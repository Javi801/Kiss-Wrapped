import { useRef, useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";

const MARGIN_TOP = 28;
const MARGIN_RIGHT = 8;
const MARGIN_BOTTOM = 8;
const APPROX_CHAR_PX = 6;
const MIN_DATA_W = 80;
const ROW_H = 36;
const GAP = 3;

function cellColor(count, maxCount, cardSoft, heatmapRgb, alphaBase = 0.15, exponent = 1) {
  if (!count || !maxCount) return cardSoft;
  const t = count / maxCount;
  const alpha = alphaBase + Math.pow(t, exponent) * (1 - alphaBase);
  return `rgba(${heatmapRgb}, ${alpha})`;
}

export default function HeatmapChartCard({ title, subtitle, data, allYears, emptyText }) {
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
  const colW = numYears > 0 ? chartW / numYears : 0;

  const maxCount = useMemo(() => {
    let max = 0;
    for (const person of data) {
      for (const count of Object.values(person.yearCounts)) {
        if (count > max) max = count;
      }
    }
    return max;
  }, [data]);

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
              {allYears.map((year, j) => (
                <text
                  key={year}
                  x={marginLeft + j * colW + colW / 2}
                  y={MARGIN_TOP - 10}
                  textAnchor="middle"
                  fontSize={11}
                  fill={PALETTE.textSoft}
                >
                  {year}
                </text>
              ))}

              {/* Rows */}
              {data.map((person, i) => {
                const rowY = MARGIN_TOP + i * ROW_H;

                return (
                  <g key={person.label}>
                    {/* Name label */}
                    <text
                      x={marginLeft - 8}
                      y={rowY + ROW_H / 2 + 4}
                      textAnchor="end"
                      fontSize={12}
                      fill={PALETTE.text}
                    >
                      {person.label}
                    </text>

                    {/* One cell per year */}
                    {allYears.map((year, j) => {
                      const count = person.yearCounts[year] || 0;
                      const cellX = marginLeft + j * colW + GAP / 2;
                      const cellW = colW - GAP;
                      const cellH = ROW_H - GAP;
                      const useDarkText = maxCount > 0 && count / maxCount > 0.55;

                      return (
                        <g key={year}>
                          <rect
                            x={cellX}
                            y={rowY + GAP / 2}
                            width={cellW}
                            height={cellH}
                            rx={4}
                            fill={cellColor(
                              count,
                              maxCount,
                              PALETTE.cardSoft,
                              PALETTE.chartHeatmapRgb ?? "226, 115, 150",
                              PALETTE.chartHeatmapAlphaBase,
                              PALETTE.chartHeatmapExponent,
                            )}
                          />
                          {count > 0 && cellW > 20 && (
                            <text
                              x={cellX + cellW / 2}
                              y={rowY + ROW_H / 2 + 4}
                              textAnchor="middle"
                              fontSize={11}
                              fontWeight="600"
                              fill={useDarkText ? "white" : PALETTE.accent}
                            >
                              {count}
                            </text>
                          )}
                        </g>
                      );
                    })}
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
