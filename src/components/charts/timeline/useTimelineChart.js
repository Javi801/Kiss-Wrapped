import { useState, useMemo } from 'react'
import { buildTimelineSeries } from '@/components/charts/timeline/TimelineChartSeries'

/**
 * State and derived series for a timeline bar chart: the selected granularity, the period offset
 * and the bars to draw for them.
 */
export default function useTimelineChart({ countByDate, countByMonth, dateKeys, language }) {
  const [gran, setGran] = useState('week')
  const [offset, setOffset] = useState(0)

  const locale = language === 'es' ? 'es-ES' : 'en-GB'

  // Intl formatters cached per locale — constructing them is expensive
  const fmt = useMemo(
    () => ({
      weekday: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: 'long' }),
      dayMonth: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }),
      dayMonthYear: new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      monthYear: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
      shortMonth: new Intl.DateTimeFormat(locale, { month: 'short' }),
    }),
    [locale]
  )

  const { data, title, avg, maxValue, canNext } = useMemo(
    () => buildTimelineSeries({ gran, offset, countByDate, countByMonth, dateKeys, fmt }),
    [gran, offset, countByDate, countByMonth, dateKeys, fmt]
  )

  const chartData = useMemo(
    () =>
      data.map((item, index) => ({ ...item, xKey: `${item.tooltipLabel || item.label}-${index}` })),
    [data]
  )

  // Switching granularity always returns to the current period
  const selectGran = (g) => {
    setGran(g)
    setOffset(0)
  }

  return {
    gran,
    offset,
    setOffset,
    selectGran,
    locale,
    data,
    chartData,
    title,
    avg,
    maxValue,
    canNext,
  }
}
