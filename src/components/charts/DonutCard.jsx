import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CHART_COLORS, TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import FullscreenChartWrapper from './FullscreenChartWrapper'
import { useFullscreen } from './FullscreenContext'
import { useResponsivePieRadius } from './useResponsivePieRadius'
import ChartTooltip from './ChartTooltip'

/**
 * Generic donut chart card with a persons/events mode toggle and legend.
 *
 * @param {Object} modes - per-mode config keyed by mode id, each with
 *   { data, title, subtitle, label, tooltipUnit: { one, many } }.
 * @param {string[]} order - mode ids in display order; the first is the default.
 * @param {string} emptyText - shown when the active mode has no data.
 * @param {(entry, index) => string} [colorFn] - optional per-slice color resolver;
 *   falls back to the palette's chart colors by index.
 */
export default function DonutCard({ modes, order, emptyText, colorFn = null }) {
  const P = usePalette()
  const isFullscreen = useFullscreen()
  const [mode, setMode] = useState(order[0])
  const { chartHeight, innerRadius, outerRadius } = useResponsivePieRadius(isFullscreen)

  const chartColors = P.chartColors ?? CHART_COLORS
  const { data, title, subtitle, tooltipUnit } = modes[mode]

  const fills = data.map((entry, index) =>
    colorFn ? colorFn(entry, index) : chartColors[index % chartColors.length]
  )

  return (
    <FullscreenChartWrapper>
      <Card
        className="rounded-3xl"
        style={{
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          backdropFilter: 'blur(8px)',
          borderColor: P.cardBorder,
          backgroundColor: P.cardBg,
        }}
      >
        <CardHeader style={{ paddingBottom: '0.5rem' }}>
          <CardTitle style={{ ...TEXT.title, color: P.text }}>{title}</CardTitle>
          <CardDescription style={{ color: P.textSoft }}>{subtitle}</CardDescription>

          {/* Mode selector */}
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              padding: '0.25rem',
              background: P.accentMuted,
              borderRadius: '0.875rem',
              marginTop: '0.5rem',
            }}
          >
            {order.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: '0.3rem 0',
                  borderRadius: '0.625rem',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: mode === m ? 600 : 400,
                  background:
                    mode === m
                      ? `linear-gradient(90deg, ${P.accent}, ${P.accentSoft})`
                      : 'transparent',
                  color: mode === m ? 'white' : P.textSoft,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {modes[m].label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {data.length ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                overflow: 'hidden',
              }}
            >
              <div style={{ height: chartHeight, width: '100%', outline: 'none' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={innerRadius}
                      outerRadius={outerRadius}
                      paddingAngle={3}
                    >
                      {data.map((entry, index) => (
                        <Cell key={entry.label} fill={fills[index]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip tooltipUnit={tooltipUnit} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  overflow: 'hidden',
                }}
              >
                {data.map((entry, index) => (
                  <div
                    key={entry.label}
                    className="rounded-full"
                    style={{
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      paddingLeft: '0.75rem',
                      paddingRight: '0.75rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      ...TEXT.caption,
                      backgroundColor: P.cardSoft,
                      color: P.textSoft,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span
                        className="rounded-full"
                        style={{
                          height: '0.625rem',
                          width: '0.625rem',
                          flexShrink: 0,
                          backgroundColor: fills[index],
                        }}
                      />
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
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
              style={{
                border: '1px dashed',
                padding: '2rem',
                textAlign: 'center',
                ...TEXT.body,
                borderColor: P.inputBorder,
                color: P.textSoft,
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
