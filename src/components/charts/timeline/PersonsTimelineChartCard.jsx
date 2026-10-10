import { useMemo } from 'react'
import TimelineChartCard from '@/components/charts/timeline/TimelineChartCard'

export default function PersonsTimelineChartCard({ people, t, language }) {
  // Unique person count per date key (yyyy.MM.dd → n)
  const countByDate = useMemo(() => {
    const map = new Map()
    for (const person of people) {
      const seen = new Set()
      for (const ev of person.events || []) {
        if (ev.date && !seen.has(ev.date)) {
          seen.add(ev.date)
          map.set(ev.date, (map.get(ev.date) || 0) + 1)
        }
      }
    }
    return map
  }, [people])

  // Unique person count per year-month key (yyyy.MM → n)
  const countByMonth = useMemo(() => {
    const map = new Map()
    for (const person of people) {
      const seen = new Set()
      for (const ev of person.events || []) {
        if (ev.date) {
          const ym = ev.date.slice(0, 7)
          if (!seen.has(ym)) {
            seen.add(ym)
            map.set(ym, (map.get(ym) || 0) + 1)
          }
        }
      }
    }
    return map
  }, [people])

  // All event dates (for historic range calculation)
  const allEventDates = useMemo(
    () => people.flatMap((p) => (p.events || []).map((e) => e.date)).filter(Boolean),
    [people]
  )

  const unit = useMemo(
    () => ({ one: t.chartPerson, many: t.chartPersons }),
    [t.chartPerson, t.chartPersons]
  )

  return (
    <TimelineChartCard
      title={t.personsTimelineTitle}
      unit={unit}
      emptyLabel={t.noPersons}
      countByDate={countByDate}
      countByMonth={countByMonth}
      dateKeys={allEventDates}
      t={t}
      language={language}
    />
  )
}
