// Returns null for an invalid format or impossible date (e.g. Feb 30).
export function parseCalendarDate(str) {
  if (!str || !/^\d{4}\.\d{2}\.\d{2}$/.test(str)) return null
  const [y, m, d] = str.split('.').map(Number)
  const dt = new Date(y, m - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null
  return { year: y, month: m, day: d }
}

export function toCalendarDate(year, month, day) {
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`
}

// Mon-first cell array; nulls fill incomplete leading/trailing weeks.
export function buildDayGrid(year, month) {
  const totalDays = new Date(year, month, 0).getDate()
  const rawFirst = new Date(year, month - 1, 1).getDay() // 0 = Sun
  const startOffset = (rawFirst + 6) % 7 // Mon = 0

  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]

  while (cells.length % 7 !== 0) cells.push(null)

  return cells
}

// Cycles: days → months → years → days.
export function nextCalView(view) {
  if (view === 'days') return 'months'
  if (view === 'months') return 'years'
  return 'days'
}
