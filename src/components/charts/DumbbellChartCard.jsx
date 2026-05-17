import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";

const MARGIN_TOP = 28;
const MARGIN_RIGHT = 16;
const MARGIN_BOTTOM = 8;
const APPROX_CHAR_PX = 6;
const NAMES_W = 80;
const MAX_NAME_CHARS = Math.floor((NAMES_W - 14) / APPROX_CHAR_PX);
const MIN_COL_W = 36;
const ROW_H = 44;
const DOT_R = 4;
const MAX_VISIBLE_ROWS = 10;

export default function DumbbellChartCard({ title, subtitle, data, allYears, emptyText }) {
  const PALETTE = usePalette();
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const scrolledRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(300);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (scrolledRef.current) return;
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = el.scrollWidth;
    scrolledRef.current = true;
  }, [containerWidth]);

  const marginLeft = NAMES_W;

  const numYears = allYears.length;
  const chartH = data.length * ROW_H;

  // Data column width: at least MIN_COL_W per year so horizontal scroll activates when needed.
  const availableW = Math.max(containerWidth - marginLeft, 0);
  const dataW = Math.max(availableW, numYears * MIN_COL_W) + MARGIN_RIGHT;
  // Actual chart area width for year position math.
  const chartW = dataW - MARGIN_RIGHT;

  // X coordinate within the data SVG (no marginLeft offset).
  const xForYear = (year) => {
    if (numYears <= 1) return chartW / 2;
    const idx = allYears.indexOf(year);
    return idx * (chartW / (numYears - 1));
  };

  const maxHeight = MARGIN_TOP + Math.min(data.length, MAX_VISIBLE_ROWS) * ROW_H + MARGIN_BOTTOM;
  const totalW = marginLeft + dataW;
  const totalH = MARGIN_TOP + chartH + MARGIN_BOTTOM;

  const cardStyle = { borderColor: PALETTE.cardBorder, backgroundColor: PALETTE.cardBg };
  const emptyStyle = { borderColor: PALETTE.inputBorder, color: PALETTE.textSoft };

  return (
    <Card
      className="rounded-3xl"
      style={{ overflow: "hidden", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", backdropFilter: "blur(8px)", ...cardStyle }}
    >
      <CardHeader style={{ paddingBottom: "0.5rem" }}>
        <CardTitle style={{ ...TEXT.title, color: PALETTE.text }}>{title}</CardTitle>
        <CardDescription style={{ color: PALETTE.textSoft }}>{subtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        {data.length && allYears.length ? (
          <div ref={containerRef}>
            {/*
              Single scroll container for both axes.
              Year labels (sticky top) and name labels (sticky left) stay visible
              while scrolling the chart, bounded within the card.
            */}
            <div
              ref={scrollRef}
              style={{
                overflow: "auto",
                maxHeight,
                WebkitOverflowScrolling: "touch",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `${marginLeft}px ${dataW}px`,
                  gridTemplateRows: `${MARGIN_TOP}px ${chartH + MARGIN_BOTTOM}px`,
                  width: totalW,
                  height: totalH,
                }}
              >
                {/* Top-left corner: sticky in both directions */}
                <div
                  style={{
                    position: "sticky",
                    top: 0,
                    left: 0,
                    zIndex: 3,
                    backgroundColor: PALETTE.cardSoft,
                  }}
                />

                {/* Year labels row: sticky to top, scrolls horizontally with data */}
                <div
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    backgroundColor: PALETTE.cardSoft,
                  }}
                >
                  <svg
                    width={dataW}
                    height={MARGIN_TOP}
                    aria-hidden="true"
                    style={{ display: "block" }}
                  >
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
                  </svg>
                </div>

                {/* Person name labels: sticky to left, scrolls vertically with rows */}
                <div
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                    backgroundColor: PALETTE.cardSoft,
                  }}
                >
                  <svg
                    width={marginLeft}
                    height={chartH + MARGIN_BOTTOM}
                    aria-hidden="true"
                    style={{ display: "block" }}
                  >
                    {data.map((person, i) => {
                      const label = person.label.length > MAX_NAME_CHARS
                        ? person.label.slice(0, MAX_NAME_CHARS - 1) + "…"
                        : person.label;
                      return (
                        <text
                          key={person.label}
                          x={marginLeft - 8}
                          y={i * ROW_H + ROW_H / 2 + 4}
                          textAnchor="end"
                          fontSize={12}
                          fill={PALETTE.text}
                        >
                          {label}
                        </text>
                      );
                    })}
                  </svg>
                </div>

                {/* Data area: grid lines, row dividers, dots and connecting lines */}
                <svg
                  width={dataW}
                  height={chartH + MARGIN_BOTTOM}
                  aria-hidden="true"
                  style={{ display: "block" }}
                >
                  {/* Vertical grid lines */}
                  {allYears.map((year) => (
                    <line
                      key={year}
                      x1={xForYear(year)}
                      y1={0}
                      x2={xForYear(year)}
                      y2={chartH}
                      stroke={PALETTE.cardBorder}
                      strokeWidth={1}
                    />
                  ))}

                  {/* Horizontal row dividers */}
                  {data.map((_, i) => (
                    <line
                      key={i}
                      x1={0}
                      y1={i * ROW_H}
                      x2={chartW}
                      y2={i * ROW_H}
                      stroke={PALETTE.cardBorder}
                      strokeWidth={0.5}
                      strokeDasharray="3 3"
                    />
                  ))}

                  {/* Per-person rows */}
                  {data.map((person, i) => {
                    const cy = i * ROW_H + ROW_H / 2;
                    const sortedYears = [...person.years].sort();

                    return (
                      <g key={person.label}>
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
