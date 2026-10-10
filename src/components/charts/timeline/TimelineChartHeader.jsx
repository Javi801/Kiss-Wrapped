import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import { GRANS } from '@/components/charts/timeline/TimelineChartSeries'
import TimelineCalendarPopup from '@/components/charts/timeline/TimelineCalendarPopup'

/** Granularity selector, period navigation and average line of a timeline chart card. */
export default function TimelineChartHeader({ timeline, t, unit }) {
  const P = usePalette()
  const { gran, offset, setOffset, selectGran, locale, title, avg, canNext } = timeline

  const granLabels = {
    week: t.granWeek,
    month: t.granMonth,
    year: t.granYear,
    historic: t.granHistoric,
  }

  const navBtn = (enabled) => ({
    background: 'none',
    border: 'none',
    cursor: enabled ? 'pointer' : 'default',
    color: enabled ? P.textSoft : 'transparent',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '0.5rem',
    flexShrink: 0,
  })

  return (
    <>
      {/* Granularity selector */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          padding: '0.25rem',
          background: P.accentMuted,
          borderRadius: '0.875rem',
        }}
      >
        {GRANS.map((g) => (
          <button
            key={g}
            onClick={() => selectGran(g)}
            style={{
              flex: 1,
              padding: '0.3rem 0',
              borderRadius: '0.625rem',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: gran === g ? 600 : 400,
              background:
                gran === g ? `linear-gradient(90deg, ${P.accent}, ${P.accentSoft})` : 'transparent',
              color: gran === g ? 'white' : P.textSoft,
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            {granLabels[g]}
          </button>
        ))}
      </div>

      {/* Navigation arrows + period title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.5rem',
          gap: '0.5rem',
        }}
      >
        {gran !== 'historic' && (
          <button onClick={() => setOffset((o) => o - 1)} style={navBtn(true)}>
            <ChevronLeft size={18} />
          </button>
        )}
        {gran !== 'historic' ? (
          <TimelineCalendarPopup
            gran={gran}
            offset={offset}
            onOffsetChange={setOffset}
            locale={locale}
            title={title}
          />
        ) : (
          <span
            style={{
              ...TEXT.body,
              color: P.text,
              fontWeight: 500,
              textAlign: 'center',
              flex: 1,
            }}
          >
            {title}
          </span>
        )}
        {gran !== 'historic' && (
          <button
            onClick={() => setOffset((o) => o + 1)}
            disabled={!canNext}
            style={navBtn(canNext)}
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      <p style={{ ...TEXT.body, color: P.textSoft, textAlign: 'center', marginTop: '0.25rem' }}>
        {avg % 1 === 0 ? avg : avg.toFixed(1)} {avg === 1 ? unit.one : unit.many} {t.timelineAvg}
      </p>
    </>
  )
}
