import { useRef, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import FullscreenChartWrapper from './FullscreenChartWrapper'
import { useFullscreen } from './FullscreenContext'

const MARGIN_TOP = 28
const MARGIN_BOTTOM = 8
const MARGIN_HORIZONTAL = 5
const PADDING_HORIZONTAL = 30
const APPROX_CHAR_PX = 6
const NAMES_W = 80
const MIN_COL_W = 36
const ROW_H = 36
const DOT_R = 4
const MAX_VISIBLE_ROWS = 12

export default function DumbbellChartCard({ title, subtitle, data, allYears, emptyText }) {
  const PALETTE = usePalette()
  const isFullscreen = useFullscreen()
  const containerRef = useRef(null)
  const scrollRef = useRef(null)
  const scrolledRef = useRef(false)
  const [containerWidth, setContainerWidth] = useState(300)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (scrolledRef.current) return
    const el = scrollRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    el.scrollLeft = el.scrollWidth
    scrolledRef.current = true
  }, [containerWidth])

  const marginLeft = NAMES_W

  const numYears = allYears.length
  const chartH = data.length * ROW_H

  // Data column width: at least MIN_COL_W per year so horizontal scroll activates when needed.
  const availableW = Math.max(containerWidth - marginLeft, 0)
  const dataW = Math.max(availableW, numYears * MIN_COL_W) + PADDING_HORIZONTAL
  // Actual chart area width for year position math.
  const chartW = dataW - PADDING_HORIZONTAL
  const totalW = marginLeft + dataW

  // X coordinate within the data SVG. PADDING_HORIZONTAL offsets the first year away from the names border.
  // The range (chartW - PADDING_HORIZONTAL) preserves the right margin.
  const xForYear = (year) => {
    if (numYears <= 1) return PADDING_HORIZONTAL + chartW / 2
    const idx = allYears.indexOf(year)
    return PADDING_HORIZONTAL + idx * ((chartW - PADDING_HORIZONTAL) / (numYears - 1))
  }

  const maxHeight = isFullscreen
    ? undefined
    : MARGIN_TOP + Math.min(data.length, MAX_VISIBLE_ROWS) * ROW_H + MARGIN_BOTTOM
  const totalH = MARGIN_TOP + chartH + MARGIN_BOTTOM

  const cardStyle = { borderColor: PALETTE.cardBorder, backgroundColor: PALETTE.cardBg }
  const emptyStyle = { borderColor: PALETTE.inputBorder, color: PALETTE.textSoft }
  const labelContentW = Math.max(
    marginLeft,
    Math.max(...data.map((person) => person.label?.length ?? 0), 0) * APPROX_CHAR_PX + 16
  )

  return (
    <FullscreenChartWrapper centerContent>
      <Card
        className="rounded-3xl"
        style={{
          overflow: 'hidden',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          backdropFilter: 'blur(8px)',
          ...cardStyle,
        }}
      >
        <CardHeader style={{ paddingBottom: '0.5rem' }}>
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
                  overflow: 'auto',
                  maxHeight,
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `${marginLeft}px ${MARGIN_HORIZONTAL + 1}px ${dataW}px`,
                    gridTemplateRows: `${MARGIN_TOP}px ${chartH + MARGIN_BOTTOM}px`,
                    width: totalW,
                    height: totalH,
                  }}
                >
                  {/* Top-left corner: sticky in both directions */}
                  <div
                    style={{
                      gridColumn: 1,
                      position: 'sticky',
                      top: 0,
                      left: 0,
                      zIndex: 4,
                      backgroundColor: PALETTE.cardSoft,
                      marginLeft: 0,
                    }}
                  />

                  <div
                    style={{
                      gridColumn: 2,
                      gridRow: '0 / 2',
                      backgroundColor: PALETTE.cardSoft,
                      position: 'sticky',
                      height: '100%',
                      top: 0,
                      left: marginLeft,
                      zIndex: 5,
                      width: MARGIN_HORIZONTAL + 1,
                      borderLeft: `1px solid ${PALETTE.cardBorder}`,
                    }}
                  />

                  {/* Year labels row: sticky to top, scrolls horizontally with data */}
                  <div
                    style={{
                      gridColumn: 3,
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      backgroundColor: PALETTE.cardSoft,
                    }}
                  >
                    <svg
                      width={dataW}
                      height={MARGIN_TOP}
                      aria-hidden="true"
                      style={{ display: 'block' }}
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
                      gridColumn: 1,
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      backgroundColor: PALETTE.cardSoft,
                    }}
                  >
                    <div
                      style={{
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        WebkitOverflowScrolling: 'touch',
                        marginLeft: MARGIN_HORIZONTAL,
                        marginRight: MARGIN_HORIZONTAL,
                      }}
                    >
                      <svg
                        width={labelContentW}
                        height={chartH + MARGIN_BOTTOM}
                        aria-hidden="true"
                        style={{ display: 'block' }}
                      >
                        {data.map((person, i) => (
                          <text
                            key={person.label}
                            x={3}
                            y={i * ROW_H + ROW_H / 2 + 4}
                            textAnchor="start"
                            fontSize={12}
                            fill={PALETTE.text}
                          >
                            {person.label}
                          </text>
                        ))}
                      </svg>
                    </div>
                  </div>

                  <div
                    style={{
                      gridColumn: 2,
                      gridRow: '2 / 3',
                      position: 'sticky',
                      left: marginLeft,
                      zIndex: 2,
                      display: 'flex',
                    }}
                  >
                    <div
                      style={{
                        justifyContent: 'flex-start',
                        width: 1,
                        backgroundColor: PALETTE.cardBorder,
                      }}
                    />

                    <div
                      style={{
                        justifyContent: 'flex-end',
                        backgroundColor: PALETTE.cardBg,
                        width: MARGIN_HORIZONTAL,
                      }}
                    />
                  </div>

                  {/* Data area: grid lines, row dividers, dots and connecting lines */}
                  <div
                    style={{
                      gridColumn: 3,
                      backgroundColor: PALETTE.cardBg,
                    }}
                  >
                    <svg
                      width={dataW}
                      height={chartH + MARGIN_BOTTOM}
                      aria-hidden="true"
                      style={{ display: 'block' }}
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
                          x2={dataW}
                          y2={i * ROW_H}
                          stroke={PALETTE.cardBorder}
                          strokeWidth={0.5}
                          strokeDasharray="3 3"
                        />
                      ))}

                      {/* Per-person rows */}
                      {data.map((person, i) => {
                        const cy = i * ROW_H + ROW_H / 2
                        const sortedYears = [...person.years].sort()

                        return (
                          <g key={person.label}>
                            {/* Lines connecting consecutive years */}
                            {sortedYears.map((year, j) => {
                              if (j === 0) return null
                              const prev = sortedYears[j - 1]
                              if (Number(year) - Number(prev) !== 1) return null
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
                              )
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
                        )
                      })}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl"
              style={{
                border: '1px dashed',
                padding: '2rem',
                textAlign: 'center',
                ...TEXT.body,
                ...emptyStyle,
              }}
            >
              {emptyText}
            </div>
          )}
        </CardContent>
      </Card>
    </FullscreenChartWrapper>
  )
}
