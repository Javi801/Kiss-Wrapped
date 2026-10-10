import { useMemo } from 'react'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import { buildDayGrid } from '@/lib/calendar'
import {
  YEAR_PAGE_SIZE,
  capitalize,
  gridItemStyle,
} from '@/components/charts/TimelineCalendarHelpers'

// One selectable cell (day, month or year). `state` is the per-view object from useTimelineCalendar.
function GridItem({ value, state, style, children }) {
  const P = usePalette()
  const isSelected = state.isSelected(value)
  const isToday = state.isToday(value)
  const isDisabled = state.isDisabled(value)

  return (
    <button
      type="button"
      onClick={() => state.select(value)}
      disabled={isDisabled}
      style={{ ...gridItemStyle(P, { isSelected, isToday, isDisabled }), ...style }}
      onMouseEnter={(e) => {
        if (!isSelected && !isDisabled) e.currentTarget.style.backgroundColor = P.accentMuted
      }}
      onMouseLeave={(e) => {
        if (!isSelected && !isDisabled)
          e.currentTarget.style.backgroundColor = isToday ? P.accentMuted : 'transparent'
      }}
    >
      {children}
    </button>
  )
}

// Day grid (week gran)
export function TimelineCalendarDayGrid({ viewYear, viewMonth, locale, state }) {
  const P = usePalette()
  const cells = buildDayGrid(viewYear, viewMonth)

  const dayHeaders = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        capitalize(
          new Intl.DateTimeFormat(locale, { weekday: 'narrow' })
            .format(new Date(2024, 0, 1 + i))
            .replace(/\.$/, '')
        )
      ),
    [locale]
  )

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          marginBottom: '4px',
        }}
      >
        {dayHeaders.map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: 'center',
              ...TEXT.caption,
              color: P.textSoft,
              fontWeight: 600,
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />
          return (
            <GridItem
              key={day}
              value={day}
              state={state}
              style={{ aspectRatio: '1', borderRadius: '50%' }}
            >
              {day}
            </GridItem>
          )
        })}
      </div>
    </>
  )
}

export function TimelineCalendarMonthGrid({ locale, state }) {
  const fmtShortMonth = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'short' }), [locale])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
        <GridItem
          key={m}
          value={m}
          state={state}
          style={{ padding: '0.4rem 0', textTransform: 'capitalize' }}
        >
          {capitalize(fmtShortMonth.format(new Date(2000, m - 1, 1)).replace(/\.$/, ''))}
        </GridItem>
      ))}
    </div>
  )
}

export function TimelineCalendarYearGrid({ yearPageStart, state }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
      {Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => yearPageStart + i).map((yr) => (
        <GridItem key={yr} value={yr} state={state} style={{ padding: '0.4rem 0' }}>
          {yr}
        </GridItem>
      ))}
    </div>
  )
}
