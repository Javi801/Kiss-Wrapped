import { useState, useRef, useEffect } from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import { parseCalendarDate, toCalendarDate, buildDayGrid, nextCalView } from '@/lib/calendar'

function getMonthLabel(year, month) {
  return new Intl.DateTimeFormat(navigator.language, { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1)
  )
}

function getShortMonth(month) {
  return new Intl.DateTimeFormat(navigator.language, { month: 'short' }).format(
    new Date(2000, month - 1, 1)
  )
}

const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const YEAR_PAGE_SIZE = 12

// Text input paired with a calendar dropdown; value format is yyyy.MM.dd.
export function DatePicker({ value, onChange, placeholder, className, style }) {
  const PALETTE = usePalette()
  const navBtn = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.75rem',
    height: '1.75rem',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    color: PALETTE.textSoft,
    cursor: 'pointer',
    transition: 'background-color 0.1s',
  }
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const today = new Date()
  const todayY = today.getFullYear()
  const todayM = today.getMonth() + 1
  const todayD = today.getDate()

  const parsed = parseCalendarDate(value)

  const [viewYear, setViewYear] = useState(parsed?.year ?? todayY)
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? todayM)
  const [calView, setCalView] = useState('days') // "days" | "months" | "years"
  const [yearPageStart, setYearPageStart] = useState(() => viewYear - 5) // first year in the page

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function handleTextChange(e) {
    const raw = e.target.value

    // Strip everything that isn't a digit, then insert dots at positions 4 and 7.
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    let formatted = digits
    if (digits.length > 4) formatted = digits.slice(0, 4) + '.' + digits.slice(4)
    if (digits.length > 6) formatted = formatted.slice(0, 7) + '.' + digits.slice(6)

    onChange(formatted)
    const p = parseCalendarDate(formatted)
    if (p) {
      setViewYear(p.year)
      setViewMonth(p.month)
    }
  }

  function toggleOpen() {
    if (!open) setCalView('days')
    setOpen((o) => !o)
  }

  // Title click cycles: days → months → years → days.
  function handleTitleClick() {
    if (calView === 'months') setYearPageStart(viewYear - 5)
    setCalView(nextCalView(calView))
  }

  function prevMonth() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1)
      setViewMonth(12)
    } else setViewMonth((m) => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1)
      setViewMonth(1)
    } else setViewMonth((m) => m + 1)
  }

  function isFutureDay(day) {
    if (viewYear > todayY || (viewYear === todayY && viewMonth > todayM)) return true
    return viewYear === todayY && viewMonth === todayM && day > todayD
  }

  function isFutureMonth(m) {
    return viewYear > todayY || (viewYear === todayY && m > todayM)
  }

  function isFutureYear(yr) {
    return yr > todayY
  }

  const isNextDisabled =
    (calView === 'days' && viewYear === todayY && viewMonth === todayM) ||
    (calView === 'months' && viewYear >= todayY) ||
    (calView === 'years' && yearPageStart + YEAR_PAGE_SIZE - 1 >= todayY)

  function selectDay(day) {
    if (isFutureDay(day)) return
    onChange(toCalendarDate(viewYear, viewMonth, day))
    setOpen(false)
    setCalView('days')
  }

  function selectMonth(month) {
    if (isFutureMonth(month)) return
    setViewMonth(month)
    setCalView('days')
  }

  function selectYear(year) {
    if (isFutureYear(year)) return
    setViewYear(year)
    setCalView('months')
  }

  function handlePrev() {
    if (calView === 'days') prevMonth()
    else if (calView === 'months') setViewYear((y) => y - 1)
    else setYearPageStart((s) => s - YEAR_PAGE_SIZE)
  }

  function handleNext() {
    if (isNextDisabled) return
    if (calView === 'days') nextMonth()
    else if (calView === 'months') setViewYear((y) => y + 1)
    else setYearPageStart((s) => s + YEAR_PAGE_SIZE)
  }

  const cells = buildDayGrid(viewYear, viewMonth)

  function gridItemStyle({ isSelected, isToday, isActive, isDisabled }) {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: isDisabled ? 'default' : 'pointer',
      fontSize: '0.8125rem',
      fontWeight: isSelected || isToday ? 600 : 400,
      color: isDisabled
        ? PALETTE.line
        : isSelected
          ? 'white'
          : isActive
            ? PALETTE.accent
            : PALETTE.text,
      backgroundColor:
        isSelected && !isDisabled
          ? PALETTE.accent
          : isActive && !isDisabled
            ? PALETTE.accentMuted
            : 'transparent',
      transition: 'background-color 0.1s',
    }
  }

  let titleLabel
  if (calView === 'days') titleLabel = getMonthLabel(viewYear, viewMonth)
  else if (calView === 'months') titleLabel = String(viewYear)
  else titleLabel = `${yearPageStart} – ${yearPageStart + YEAR_PAGE_SIZE - 1}`

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Input
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          className={className}
          style={{ ...style, flex: 1 }}
        />
        <button
          type="button"
          aria-label="Open calendar"
          onClick={toggleOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.25rem',
            height: '2.25rem',
            flexShrink: 0,
            borderRadius: '0.75rem',
            border: `1px solid ${PALETTE.inputBorder}`,
            backgroundColor: open ? PALETTE.accentMuted : PALETTE.inputBg,
            color: PALETTE.accent,
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
        >
          <CalendarIcon size={16} />
        </button>
      </div>

      {/* calendar dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 200,
            backgroundColor: PALETTE.card,
            border: `1px solid ${PALETTE.cardBorder}`,
            borderRadius: '1rem',
            padding: '1rem',
            boxShadow: '0 8px 32px rgba(226,115,150,0.18)',
            minWidth: '268px',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={handlePrev}
              style={navBtn}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PALETTE.accentMuted)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ChevronLeft size={14} />
            </button>

            <button
              type="button"
              onClick={handleTitleClick}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.125rem 0.5rem',
                borderRadius: '0.5rem',
                ...TEXT.bodyStrong,
                color: PALETTE.text,
                textTransform: 'capitalize',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PALETTE.accentMuted)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {titleLabel}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled}
              style={{
                ...navBtn,
                cursor: isNextDisabled ? 'default' : 'pointer',
                color: isNextDisabled ? PALETTE.line : PALETTE.textSoft,
              }}
              onMouseEnter={(e) => {
                if (!isNextDisabled) e.currentTarget.style.backgroundColor = PALETTE.accentMuted
              }}
              onMouseLeave={(e) => {
                if (!isNextDisabled) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* day view */}
          {calView === 'days' && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '2px',
                  marginBottom: '4px',
                }}
              >
                {DAY_HEADERS.map((d) => (
                  <div
                    key={d}
                    style={{
                      textAlign: 'center',
                      ...TEXT.caption,
                      color: PALETTE.textSoft,
                      fontWeight: 600,
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                {cells.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} />

                  const isToday = day === todayD && viewMonth === todayM && viewYear === todayY
                  const isSelected =
                    parsed &&
                    day === parsed.day &&
                    viewMonth === parsed.month &&
                    viewYear === parsed.year
                  const isDisabled = isFutureDay(day)

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => selectDay(day)}
                      disabled={isDisabled}
                      style={{
                        ...gridItemStyle({ isSelected, isToday, isActive: isToday, isDisabled }),
                        aspectRatio: '1',
                        borderRadius: '50%',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected && !isDisabled)
                          e.currentTarget.style.backgroundColor = PALETTE.accentMuted
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected && !isDisabled)
                          e.currentTarget.style.backgroundColor = isToday
                            ? PALETTE.accentMuted
                            : 'transparent'
                      }}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* month view */}
          {calView === 'months' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const isSelected = parsed && m === parsed.month && viewYear === parsed.year
                const isToday = m === todayM && viewYear === todayY
                const isDisabled = isFutureMonth(m)

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectMonth(m)}
                    disabled={isDisabled}
                    style={{
                      ...gridItemStyle({ isSelected, isToday, isActive: isToday, isDisabled }),
                      padding: '0.4rem 0',
                      textTransform: 'capitalize',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !isDisabled)
                        e.currentTarget.style.backgroundColor = PALETTE.accentMuted
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !isDisabled)
                        e.currentTarget.style.backgroundColor = isToday
                          ? PALETTE.accentMuted
                          : 'transparent'
                    }}
                  >
                    {getShortMonth(m)}
                  </button>
                )
              })}
            </div>
          )}

          {/* year view */}
          {calView === 'years' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => yearPageStart + i).map((yr) => {
                const isSelected = parsed && yr === parsed.year
                const isToday = yr === todayY
                const isDisabled = isFutureYear(yr)

                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => selectYear(yr)}
                    disabled={isDisabled}
                    style={{
                      ...gridItemStyle({ isSelected, isToday, isActive: isToday, isDisabled }),
                      padding: '0.4rem 0',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !isDisabled)
                        e.currentTarget.style.backgroundColor = PALETTE.accentMuted
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !isDisabled)
                        e.currentTarget.style.backgroundColor = isToday
                          ? PALETTE.accentMuted
                          : 'transparent'
                    }}
                  >
                    {yr}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
