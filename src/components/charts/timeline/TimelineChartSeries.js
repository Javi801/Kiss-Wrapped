// Pure builders for the timeline bar charts: one series of bars per granularity.

export const GRANS = ['week', 'month', 'year', 'historic']

const DAY_MS = 86400000
const MAX_YEAR_LABELS = 5
const EMPTY_SERIES = { data: [], title: '', avg: 0, maxValue: 1, canNext: false }

const pad2 = (n) => String(n).padStart(2, '0')

function dateToKey(d) {
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function parseKey(k) {
  const [y, m, d] = k.split('.')
  return new Date(+y, +m - 1, +d)
}

// Some locales end abbreviations with a dot ("lun."), which the axis does not need
const stripDot = (str) => str.replace(/\.$/, '')

function summarize(items, title, canNext) {
  const total = items.reduce((s, d) => s + d.value, 0)
  return {
    data: items,
    title,
    avg: total / items.length,
    maxValue: Math.max(...items.map((d) => d.value), 1),
    canNext,
  }
}

// One bar per day labelled with its weekday, starting at `start`
function weekdayItems(start, length, countByDate, fmt) {
  return Array.from({ length }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return {
      label: capitalize(stripDot(fmt.weekday.format(d))),
      tooltipLabel: stripDot(fmt.weekdayLong.format(d)),
      value: countByDate.get(dateToKey(d)) || 0,
    }
  })
}

function buildWeek(today, offset, countByDate, fmt) {
  const dow = today.getDay()
  const toMon = dow === 0 ? 6 : dow - 1
  const mon = new Date(today)
  mon.setDate(today.getDate() - toMon + offset * 7)

  const items = weekdayItems(mon, 7, countByDate, fmt)

  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const title = `${fmt.dayMonth.format(mon)} – ${fmt.dayMonthYear.format(sun)}`
  return summarize(items, title, offset < 0)
}

function buildMonth(today, offset, countByDate, fmt) {
  const ref = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const yr = ref.getFullYear()
  const mo = ref.getMonth()
  const mm = pad2(mo + 1)
  const dim = new Date(yr, mo + 1, 0).getDate()

  const lblSet = new Set([0, Math.round(dim / 3) - 1, Math.round((2 * dim) / 3) - 1, dim - 1])

  const items = Array.from({ length: dim }, (_, i) => {
    const dayMonth = `${pad2(i + 1)}-${mm}`
    return {
      label: lblSet.has(i) ? dayMonth : '',
      tooltipLabel: dayMonth,
      value: countByDate.get(`${yr}.${mm}.${pad2(i + 1)}`) || 0,
    }
  })
  return summarize(items, capitalize(fmt.monthYear.format(ref)), offset < 0)
}

function buildYear(today, offset, countByMonth, fmt) {
  const yr = today.getFullYear() + offset
  const items = Array.from({ length: 12 }, (_, i) => ({
    label: String(i + 1),
    tooltipLabel: capitalize(stripDot(fmt.shortMonth.format(new Date(yr, i, 1)))),
    value: countByMonth.get(`${yr}.${pad2(i + 1)}`) || 0,
  }))
  return summarize(items, String(yr), offset < 0)
}

// One bar per day, month label on each first of month
function historicDayItems(firstDate, rangeDays, countByDate, fmt) {
  return Array.from({ length: rangeDays + 1 }, (_, i) => {
    const d = new Date(firstDate)
    d.setDate(firstDate.getDate() + i)
    return {
      label: d.getDate() === 1 ? capitalize(stripDot(fmt.shortMonth.format(d))) : '',
      tooltipLabel: `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}`,
      value: countByDate.get(dateToKey(d)) || 0,
    }
  })
}

// One bar per month, year label at each January (thinned if many years)
function historicMonthItems(firstDate, lastDate, countByMonth, fmt) {
  const yr2 = lastDate.getFullYear()
  const mo2 = lastDate.getMonth()
  const items = []
  let y = firstDate.getFullYear()
  let m = firstDate.getMonth()
  while (y < yr2 || (y === yr2 && m <= mo2)) {
    items.push({
      label: m === 0 ? String(y) : '',
      tooltipLabel: `${capitalize(stripDot(fmt.shortMonth.format(new Date(y, m, 1))))} ${y}`,
      value: countByMonth.get(`${y}.${pad2(m + 1)}`) || 0,
    })
    if (++m > 11) {
      m = 0
      y++
    }
  }

  const janIndices = items.reduce((acc, item, i) => {
    if (item.label) acc.push(i)
    return acc
  }, [])
  if (janIndices.length > MAX_YEAR_LABELS) {
    const step = (janIndices.length - 1) / (MAX_YEAR_LABELS - 1)
    const keepSet = new Set(
      Array.from({ length: MAX_YEAR_LABELS }, (_, i) => janIndices[Math.round(i * step)])
    )
    for (let i = 0; i < items.length; i++) {
      if (items[i].label && !keepSet.has(i)) items[i] = { ...items[i], label: '' }
    }
  }
  return items
}

function buildHistoric(dateKeys, countByDate, countByMonth, fmt) {
  const keys = dateKeys.slice().sort()
  if (!keys.length) return { ...EMPTY_SERIES, title: '—' }

  const firstDate = parseKey(keys[0])
  const lastDate = parseKey(keys[keys.length - 1])
  const rangeDays = Math.round((lastDate - firstDate) / DAY_MS)

  const title =
    rangeDays === 0
      ? fmt.dayMonthYear.format(firstDate)
      : `${fmt.dayMonthYear.format(firstDate)} – ${fmt.dayMonthYear.format(lastDate)}`

  let items
  if (rangeDays < 7) items = weekdayItems(firstDate, rangeDays + 1, countByDate, fmt)
  else if (rangeDays <= 365) items = historicDayItems(firstDate, rangeDays, countByDate, fmt)
  else items = historicMonthItems(firstDate, lastDate, countByMonth, fmt)
  return summarize(items, title, false)
}

/**
 * Builds the bars, period title, average and Y maximum for one granularity.
 * `countByDate` is keyed by yyyy.MM.dd, `countByMonth` by yyyy.MM, and `dateKeys` lists every
 * dated entry (used for the historic range).
 */
export function buildTimelineSeries({ gran, offset, countByDate, countByMonth, dateKeys, fmt }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (gran === 'week') return buildWeek(today, offset, countByDate, fmt)
  if (gran === 'month') return buildMonth(today, offset, countByDate, fmt)
  if (gran === 'year') return buildYear(today, offset, countByMonth, fmt)
  if (gran === 'historic') return buildHistoric(dateKeys, countByDate, countByMonth, fmt)
  return EMPTY_SERIES
}
