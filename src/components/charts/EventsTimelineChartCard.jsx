import { useMemo } from 'react'
import TimelineChartCard from '@/components/charts/TimelineChartCard'

export default function EventsTimelineChartCard({ allEvents, t, language }) {
  // Single-pass count by date key (yyyy.MM.dd → n)
  const countByDate = useMemo(() => {
    const map = new Map()
    for (const ev of allEvents) {
      if (ev.date) map.set(ev.date, (map.get(ev.date) || 0) + 1)
    }
    return map
  }, [allEvents])

  // Single-pass count by year-month key (yyyy.MM → n) for year view
  const countByMonth = useMemo(() => {
    const map = new Map()
    for (const [k, c] of countByDate) {
      const ym = k.slice(0, 7) // "yyyy.MM"
      map.set(ym, (map.get(ym) || 0) + c)
    }
    return map
  }, [countByDate])

  // All event dates (for historic range calculation)
  const allEventDates = useMemo(() => allEvents.map((e) => e.date).filter(Boolean), [allEvents])

  const unit = useMemo(
    () => ({ one: t.chartEvent, many: t.chartEvents }),
    [t.chartEvent, t.chartEvents]
  )

  return (
    <TimelineChartCard
      title={t.timelineTitle}
      unit={unit}
      emptyLabel={t.noEvents}
      countByDate={countByDate}
      countByMonth={countByMonth}
      dateKeys={allEventDates}
      t={t}
      language={language}
    />
  )
}
