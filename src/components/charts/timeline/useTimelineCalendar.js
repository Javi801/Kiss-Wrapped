import { useState, useEffect, useMemo } from 'react'
import {
  YEAR_PAGE_SIZE,
  capitalize,
  getPeriodViewDate,
  initialCalViewFor,
  weekOffsetOf,
  yearPageStartFor,
} from '@/components/charts/timeline/TimelineCalendarHelpers'

// Open state, view navigation and selection logic of the timeline calendar dropdown.
// The refs are owned by the component that renders the trigger and the dropdown.
export function useTimelineCalendar({
  gran,
  offset,
  onOffsetChange,
  locale,
  triggerRef,
  dropdownRef,
}) {
  const [open, setOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const todayY = today.getFullYear()
  const todayM = today.getMonth() + 1
  const todayD = today.getDate()

  const initialCalView = initialCalViewFor(gran)

  const [calView, setCalView] = useState(initialCalView)
  const [viewYear, setViewYear] = useState(todayY)
  const [viewMonth, setViewMonth] = useState(todayM)
  const [yearPageStart, setYearPageStart] = useState(yearPageStartFor(todayY))

  const fmtMonthYear = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale]
  )

  function toggleOpen() {
    if (open) {
      setOpen(false)
      return
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 })
    }

    const { year, month } = getPeriodViewDate(gran, offset, today)
    setViewYear(year)
    setViewMonth(month)
    setYearPageStart(yearPageStartFor(year))
    setCalView(initialCalView)
    setOpen(true)
  }

  // Close on outside click (check both trigger and dropdown)
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      )
        setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, triggerRef, dropdownRef])

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

  function handleCalPrev() {
    if (calView === 'days') {
      if (viewMonth === 1) {
        setViewYear((y) => y - 1)
        setViewMonth(12)
      } else setViewMonth((m) => m - 1)
    } else if (calView === 'months') {
      setViewYear((y) => y - 1)
    } else {
      setYearPageStart((s) => s - YEAR_PAGE_SIZE)
    }
  }

  function handleCalNext() {
    if (isNextDisabled) return
    if (calView === 'days') {
      if (viewMonth === 12) {
        setViewYear((y) => y + 1)
        setViewMonth(1)
      } else setViewMonth((m) => m + 1)
    } else if (calView === 'months') {
      setViewYear((y) => y + 1)
    } else {
      setYearPageStart((s) => s + YEAR_PAGE_SIZE)
    }
  }

  // Title click cycles for faster navigation:
  // week: days → months → years → days
  // month: months → years → months
  // year: no cycling
  const canCycleTitle = gran === 'week' || gran === 'month'

  function handleTitleClick() {
    if (gran === 'week') {
      if (calView === 'days') {
        setYearPageStart(yearPageStartFor(viewYear))
        setCalView('months')
      } else if (calView === 'months') {
        setYearPageStart(yearPageStartFor(viewYear))
        setCalView('years')
      } else setCalView('days')
    } else if (gran === 'month') {
      if (calView === 'months') {
        setYearPageStart(yearPageStartFor(viewYear))
        setCalView('years')
      } else setCalView('months')
    }
  }

  function selectDay(day) {
    if (isFutureDay(day)) return
    onOffsetChange(weekOffsetOf(today, viewYear, viewMonth, day))
    setOpen(false)
  }

  function selectMonth(month) {
    if (isFutureMonth(month)) return
    if (gran === 'month') {
      onOffsetChange((viewYear - today.getFullYear()) * 12 + (month - 1 - today.getMonth()))
      setOpen(false)
    } else {
      setViewMonth(month)
      setCalView('days')
    }
  }

  function selectYear(year) {
    if (isFutureYear(year)) return
    if (gran === 'year') {
      onOffsetChange(year - today.getFullYear())
      setOpen(false)
    } else {
      setViewYear(year)
      setCalView('months')
    }
  }

  function isSelectedMonth(m) {
    if (gran !== 'month') return false
    const ref = new Date(today.getFullYear(), today.getMonth() + offset, 1)
    return ref.getFullYear() === viewYear && ref.getMonth() + 1 === m
  }

  let calTitleLabel
  if (calView === 'days')
    calTitleLabel = capitalize(fmtMonthYear.format(new Date(viewYear, viewMonth - 1, 1)))
  else if (calView === 'months') calTitleLabel = String(viewYear)
  else calTitleLabel = `${yearPageStart} – ${yearPageStart + YEAR_PAGE_SIZE - 1}`

  return {
    open,
    dropdownPos,
    toggleOpen,
    calView,
    viewYear,
    viewMonth,
    yearPageStart,
    header: {
      label: calTitleLabel,
      canCycleTitle,
      isNextDisabled,
      onPrev: handleCalPrev,
      onNext: handleCalNext,
      onTitleClick: handleTitleClick,
    },
    // Per-view cell state: each grid asks these about one of its items.
    days: {
      isDisabled: isFutureDay,
      isToday: (day) => day === todayD && viewMonth === todayM && viewYear === todayY,
      isSelected: (day) => weekOffsetOf(today, viewYear, viewMonth, day) === offset,
      select: selectDay,
    },
    months: {
      isDisabled: isFutureMonth,
      isToday: (m) => m === todayM && viewYear === todayY,
      isSelected: isSelectedMonth,
      select: selectMonth,
    },
    years: {
      isDisabled: isFutureYear,
      isToday: (yr) => yr === todayY,
      isSelected: (yr) => gran === 'year' && yr === today.getFullYear() + offset,
      select: selectYear,
    },
  }
}
