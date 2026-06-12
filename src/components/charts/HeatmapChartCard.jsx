import { useRef, useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import FullscreenChartWrapper from './FullscreenChartWrapper'
import { useFullscreen } from './FullscreenContext'

const MARGIN_TOP = 40
const PADDING_RIGHT = 15
const MARGIN_BOTTOM = 8
const MARGIN_HORIZONTAL = 5
const PADDING_LEFT = PADDING_RIGHT - MARGIN_HORIZONTAL
const APPROX_CHAR_PX = 6
const NAMES_W = 80
const MIN_COL_W = 36
const ROW_H = 36
const GAP = 3
const MAX_VISIBLE_ROWS = 10

function cellColor(count, maxCount, cardSoft, heatmapRgb, alphaBase = 0.15, exponent = 1) {
  if (!count || !maxCount) return cardSoft
  const t = count / maxCount
  const alpha = alphaBase + Math.pow(t, exponent) * (1 - alphaBase)
  return `rgba(${heatmapRgb}, ${alpha})`
}

export default function HeatmapChartCard({ title, subtitle, data, allYears, emptyText }) {
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

  // Scroll to the rightmost (most recent) data once the container is sized.
  useEffect(() => {
    if (scrolledRef.current) return
    const el = scrollRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    el.scrollLeft = el.scrollWidth
    scrolledRef.current = true
  }, [containerWidth])

  const marginLeft = NAMES_W

  const numYears = allYears.length
  const availableW = Math.max(containerWidth - marginLeft, 0)
  const dataW = numYears > 0 ? Math.max(availableW, numYears * MIN_COL_W) : availableW
  // Reserve PADDING_LEFT on the left so columns start away from the names border.
  const colW = numYears > 0 ? (dataW - PADDING_LEFT) / numYears : 0

  const chartH = data.length * ROW_H
  // Cap visible rows so vertical scroll activates inside the card instead of the page.
  const maxHeight = isFullscreen
    ? undefined
    : MARGIN_TOP + Math.min(data.length, MAX_VISIBLE_ROWS) * ROW_H + MARGIN_BOTTOM

  const maxCount = useMemo(() => {
    let max = 0
    for (const person of data) {
      for (const count of Object.values(person.yearCounts)) {
        if (count > max) max = count
      }
    }
    return max
  }, [data])

  const cardStyle = { borderColor: PALETTE.cardBorder, backgroundColor: PALETTE.cardBg }
  const emptyStyle = { borderColor: PALETTE.inputBorder, color: PALETTE.textSoft }

  const totalW = marginLeft + dataW + PADDING_RIGHT
  const totalH = MARGIN_TOP + chartH + MARGIN_BOTTOM
  const labelContentW = Math.max(
    marginLeft,
    Math.max(...data.map((person) => person.label?.length ?? 0), 0) * APPROX_CHAR_PX + 16
  )

  return (
    <FullscreenChartWrapper>
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
              Year labels (sticky top) and name labels (sticky left) are CSS-sticky
              within this container, so they stay visible while scrolling the chart
              without floating over the rest of the page.
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
                    gridTemplateColumns: `${marginLeft}px ${MARGIN_HORIZONTAL + 1}px ${dataW + PADDING_RIGHT}px`,
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
                      width={dataW + PADDING_RIGHT}
                      height={MARGIN_TOP}
                      aria-hidden="true"
                      style={{ display: 'block' }}
                    >
                      {allYears.map((year, j) => {
                        const cx = PADDING_LEFT + j * colW + colW / 2
                        const cy = MARGIN_TOP - 6
                        return (
                          <text
                            key={year}
                            x={cx}
                            y={cy}
                            textAnchor="end"
                            fontSize={11}
                            fill={PALETTE.textSoft}
                            transform={`rotate(45, ${cx}, ${cy})`}
                          >
                            {year}
                          </text>
                        )
                      })}
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
                        zIndex: 1,
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

                  {/* Data cells */}
                  <svg
                    width={dataW + PADDING_RIGHT}
                    height={chartH + MARGIN_BOTTOM}
                    aria-hidden="true"
                    style={{ display: 'block' }}
                  >
                    {data.map((person, i) => {
                      const rowY = i * ROW_H
                      return (
                        <g key={person.label}>
                          {allYears.map((year, j) => {
                            const count = person.yearCounts[year] || 0
                            const cellX = PADDING_LEFT + j * colW + GAP / 2
                            const cellW = colW - GAP
                            const cellH = ROW_H - GAP
                            const useDarkText = maxCount > 0 && count / maxCount > 0.55

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
                                    PALETTE.chartHeatmapRgb ?? '226, 115, 150',
                                    PALETTE.chartHeatmapAlphaBase,
                                    PALETTE.chartHeatmapExponent
                                  )}
                                />
                                {count > 0 && cellW > 20 && (
                                  <text
                                    x={cellX + cellW / 2}
                                    y={rowY + ROW_H / 2 + 4}
                                    textAnchor="middle"
                                    fontSize={11}
                                    fontWeight="600"
                                    fill={useDarkText ? 'white' : PALETTE.accent}
                                  >
                                    {count}
                                  </text>
                                )}
                              </g>
                            )
                          })}
                        </g>
                      )
                    })}
                  </svg>
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
