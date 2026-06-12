import { useState } from 'react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import FullscreenChartWrapper from '@/components/charts/FullscreenChartWrapper'

const MODES = ['persons', 'events']

function ChartTooltip({ active, payload, tooltipUnit }) {
  const P = usePalette()
  if (!active || !payload?.length) return null
  const value = payload[0].value
  const label = payload[0].payload?.label
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

export default function ZodiacRadarCard({ personsByZodiac, eventsByZodiac, emptyText, t }) {
  const P = usePalette()
  const [mode, setMode] = useState('persons')

  const data = mode === 'persons' ? personsByZodiac : eventsByZodiac
  const hasData = data.some((d) => d.value > 0)

  const tooltipUnit =
    mode === 'persons'
      ? { one: t.chartPerson, many: t.chartPersons }
      : { one: t.chartEvent, many: t.chartEvents }

  const title = mode === 'persons' ? t.personsByZodiac : t.eventsByZodiac
  const subtitle = mode === 'persons' ? t.zodiacDistribution : t.groupedBySign

  const modeLabels = {
    persons: t.peopleStats,
    events: t.chartEvents.charAt(0).toUpperCase() + t.chartEvents.slice(1),
  }

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
          {hasData ? (
            <div style={{ height: '18rem', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={data}
                  margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
                  startAngle={210}
                  endAngle={-150}
                >
                  <PolarGrid stroke={P.cardBorder} />
                  <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: P.textSoft }} />
                  <PolarRadiusAxis
                    allowDecimals={false}
                    tick={{ fontSize: 9, fill: P.textSoft }}
                    tickCount={3}
                    axisLine={false}
                    angle={90}
                  />
                  <Tooltip content={<ChartTooltip tooltipUnit={tooltipUnit} />} />
                  <Radar
                    dataKey="value"
                    stroke={P.accent}
                    fill={P.accent}
                    fillOpacity={0.3}
                    strokeWidth={2}
                    dot={{ r: 3, fill: P.accent, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
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
