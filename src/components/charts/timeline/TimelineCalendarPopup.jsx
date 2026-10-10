import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import TimelineCalendarHeader from '@/components/charts/timeline/TimelineCalendarHeader'
import {
  TimelineCalendarDayGrid,
  TimelineCalendarMonthGrid,
  TimelineCalendarYearGrid,
} from '@/components/charts/timeline/TimelineCalendarGrids'
import { useTimelineCalendar } from '@/components/charts/timeline/useTimelineCalendar'

// Clickable period title with calendar dropdown for week/month/year granularities.
// Uses a portal so the dropdown always renders above the Recharts SVG.
export default function TimelineCalendarPopup({ gran, offset, onOffsetChange, locale, title }) {
  const P = usePalette()
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)
  const cal = useTimelineCalendar({
    gran,
    offset,
    onOffsetChange,
    locale,
    triggerRef,
    dropdownRef,
  })

  const dropdown =
    cal.open &&
    createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed',
          top: cal.dropdownPos.top,
          left: cal.dropdownPos.left,
          transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: P.card,
          border: `1px solid ${P.cardBorder}`,
          borderRadius: '1rem',
          padding: '1rem',
          boxShadow: '0 8px 32px rgba(226,115,150,0.18)',
          minWidth: '260px',
          userSelect: 'none',
        }}
      >
        <TimelineCalendarHeader {...cal.header} />

        {cal.calView === 'days' && (
          <TimelineCalendarDayGrid
            viewYear={cal.viewYear}
            viewMonth={cal.viewMonth}
            locale={locale}
            state={cal.days}
          />
        )}

        {cal.calView === 'months' && (
          <TimelineCalendarMonthGrid locale={locale} state={cal.months} />
        )}

        {cal.calView === 'years' && (
          <TimelineCalendarYearGrid yearPageStart={cal.yearPageStart} state={cal.years} />
        )}
      </div>,
      document.body
    )

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', justifyContent: 'center' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={cal.toggleOpen}
        style={{
          ...TEXT.body,
          color: P.text,
          fontWeight: 500,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.125rem 0.5rem',
          borderRadius: '0.5rem',
          transition: 'background-color 0.1s',
          width: '100%',
          textAlign: 'center',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = P.accentMuted)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {title}
      </button>
      {dropdown}
    </div>
  )
}
