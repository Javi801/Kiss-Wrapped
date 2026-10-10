import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import FullscreenChartWrapper from '@/components/charts/FullscreenChartWrapper'
import TimelineChartHeader from '@/components/charts/timeline/TimelineChartHeader'
import useTimelineChart from '@/components/charts/timeline/useTimelineChart'

function TooltipContent({ active, payload, tooltipUnit, emptyLabel, onLabel }) {
  const P = usePalette()
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  const v = item?.value ?? 0
  const tooltipLabel = item?.tooltipLabel
  const boxStyle = {
    background: P.cardBg,
    border: `1px solid ${P.cardBorder}`,
    color: P.text,
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: 13,
  }
  if (v === 0)
    return (
      <div style={boxStyle}>
        <p>{emptyLabel}</p>
      </div>
    )
  const unit = v === 1 ? tooltipUnit.one : tooltipUnit.many
  return (
    <div style={boxStyle}>
      <p>
        {v} {unit} {onLabel} {tooltipLabel}
      </p>
    </div>
  )
}

/**
 * Bar chart card over time with week / month / year / historic granularities.
 * The caller supplies the counts (`countByDate` keyed by yyyy.MM.dd, `countByMonth` by yyyy.MM),
 * every dated key for the historic range, and the texts naming what is being counted.
 */
export default function TimelineChartCard({
  title,
  unit,
  emptyLabel,
  countByDate,
  countByMonth,
  dateKeys,
  t,
  language,
}) {
  const P = usePalette()
  const timeline = useTimelineChart({ countByDate, countByMonth, dateKeys, language })
  const { data, chartData, maxValue } = timeline

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
        <CardHeader style={{ paddingBottom: '0.25rem' }}>
          <CardTitle style={{ ...TEXT.title, color: P.text }}>{title}</CardTitle>
          <TimelineChartHeader timeline={timeline} t={t} unit={unit} />
        </CardHeader>

        <CardContent>
          <div
            data-bar-chart-container
            style={{ height: '15rem', width: '100%', position: 'relative' }}
          >
            <span
              style={{
                position: 'absolute',
                top: 7,
                left: 14,
                fontSize: 10,
                color: P.textSoft,
                pointerEvents: 'none',
                lineHeight: 1,
              }}
            >
              {maxValue}
            </span>
            {data.every((d) => d.value === 0) && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingBottom: '2.5rem',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: 13, color: P.textSoft }}>{t.noDataYet}</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={P.cardBorder} />
                <XAxis
                  dataKey="xKey"
                  tickFormatter={(_, index) => chartData[index]?.label ?? ''}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tick={{ fill: P.textSoft }}
                  interval={0}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis hide domain={[0, maxValue]} />
                <Tooltip
                  cursor={{ fill: P.accentShadow }}
                  content={
                    <TooltipContent
                      tooltipUnit={unit}
                      emptyLabel={emptyLabel}
                      onLabel={t.timelineOn}
                    />
                  }
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={P.accent} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </FullscreenChartWrapper>
  )
}
