const MS_PER_DAY = 86400000

export const YEAR_PAGE_SIZE = 12

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// First year of the year page that keeps `year` around its middle.
export function yearPageStartFor(year) {
  return year - Math.floor(YEAR_PAGE_SIZE / 2)
}

export function initialCalViewFor(gran) {
  return gran === 'week' ? 'days' : gran === 'month' ? 'months' : 'years'
}

function mondayOf(date) {
  const dow = date.getDay()
  const mon = new Date(date)
  mon.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1))
  return mon
}

// Weeks between the Mon-first week of `today` and the one holding the given day (past is negative).
export function weekOffsetOf(today, year, month, day) {
  const date = new Date(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return Math.round((mondayOf(date) - mondayOf(today)) / MS_PER_DAY) / 7
}

// Year and month the calendar opens on for the period currently shown by the chart.
export function getPeriodViewDate(gran, offset, today) {
  if (gran === 'week') {
    const dow = today.getDay()
    const mon = new Date(today)
    mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
    return { year: mon.getFullYear(), month: mon.getMonth() + 1 }
  }
  if (gran === 'month') {
    const ref = new Date(today.getFullYear(), today.getMonth() + offset, 1)
    return { year: ref.getFullYear(), month: ref.getMonth() + 1 }
  }
  return { year: today.getFullYear() + offset, month: 1 }
}

export function gridItemStyle(P, { isSelected, isToday, isDisabled }) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: isDisabled ? 'default' : 'pointer',
    fontSize: '0.8125rem',
    fontWeight: isSelected || isToday ? 600 : 400,
    color: isDisabled ? P.line : isSelected ? 'white' : isToday ? P.accent : P.text,
    backgroundColor:
      isSelected && !isDisabled
        ? P.accent
        : isToday && !isSelected && !isDisabled
          ? P.accentMuted
          : 'transparent',
    transition: 'background-color 0.1s',
    borderRadius: '0.5rem',
  }
}

export function navBtnStyle(P) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.75rem',
    height: '1.75rem',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    color: P.textSoft,
    cursor: 'pointer',
    transition: 'background-color 0.1s',
  }
}
