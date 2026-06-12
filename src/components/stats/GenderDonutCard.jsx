import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CHART_COLORS, TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import FullscreenChartWrapper from '@/components/charts/FullscreenChartWrapper'
import { useFullscreen } from '@/components/charts/FullscreenContext'
import { useResponsivePieRadius } from '@/components/charts/useResponsivePieRadius'

const MODES = ['persons', 'events']

function ChartTooltip({ active, payload, tooltipUnit }) {
  const P = usePalette()
  if (!active || !payload?.length) return null
  const value = payload[0].value
  const label = payload[0].name
  const unit = value === 1 ? tooltipUnit.one : tooltipUnit.many
  return (
    <div
      style={{
        background: P.card,
        border: `1px solid ${P.line}`,
        color: P.text,
        borderRadius: '0.5rem',
        padding: '0.5rem 0.75rem',
        fontSize: 13,
      }}
    >
      <p style={{ marginBottom: '0.2rem', fontWeight: 500 }}>{label}</p>
      <p>{`${value} ${unit}`}</p>
    </div>
  )
}

export default function GenderDonutCard({ personsByGender, eventsByGender, emptyText, t }) {
  const P = usePalette()
  const isFullscreen = useFullscreen()
  const [mode, setMode] = useState('persons')
  const { chartHeight, innerRadius, outerRadius } = useResponsivePieRadius(isFullscreen)

  const chartColors = P.chartColors ?? CHART_COLORS
  const data = mode === 'persons' ? personsByGender : eventsByGender

  const tooltipUnit =
    mode === 'persons'
      ? { one: t.chartPerson, many: t.chartPersons }
      : { one: t.chartEvent, many: t.chartEvents }

  const title = mode === 'persons' ? t.personsByGender : t.eventsByGender
  const subtitle = mode === 'persons' ? t.genderSplit : t.eventsGenderSplit

  const modeLabels = {
    persons: t.peopleStats,
    events: t.chartEvents.charAt(0).toUpperCase() + t.chartEvents.slice(1),
  }

  const fills = data.map((_, index) => chartColors[index % chartColors.length])

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
            {MODES.map((m) => (
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
                {modeLabels[m]}
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
