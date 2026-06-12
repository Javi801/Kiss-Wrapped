import { describe, it, expect } from 'vitest'
import { parseCalendarDate, toCalendarDate, buildDayGrid, nextCalView } from '@/lib/calendar'

// ── parseCalendarDate ────────────────────────────────────────────────────────

describe('parseCalendarDate', () => {
  it('returns components for a valid date', () => {
    expect(parseCalendarDate('2024.03.15')).toEqual({ year: 2024, month: 3, day: 15 })
  })

  it('returns components for the first day of a month', () => {
    expect(parseCalendarDate('2026.01.01')).toEqual({ year: 2026, month: 1, day: 1 })
  })

  it('returns components for the last day of a 31-day month', () => {
    expect(parseCalendarDate('2024.01.31')).toEqual({ year: 2024, month: 1, day: 31 })
  })

  it('accepts Feb 29 on a leap year', () => {
    expect(parseCalendarDate('2024.02.29')).toEqual({ year: 2024, month: 2, day: 29 })
  })

  it('returns null for Feb 29 on a non-leap year', () => {
    expect(parseCalendarDate('2023.02.29')).toBeNull()
  })

  it('returns null for Feb 30', () => {
    expect(parseCalendarDate('2024.02.30')).toBeNull()
  })

  it('returns null for month 00', () => {
    expect(parseCalendarDate('2024.00.15')).toBeNull()
  })

  it('returns null for month 13', () => {
    expect(parseCalendarDate('2024.13.01')).toBeNull()
  })

  it('returns null for day 00', () => {
    expect(parseCalendarDate('2024.01.00')).toBeNull()
  })

  it('returns null for day 32', () => {
    expect(parseCalendarDate('2024.01.32')).toBeNull()
  })

  it('returns null for dash-separated format', () => {
    expect(parseCalendarDate('2024-03-15')).toBeNull()
  })

  it('returns null for slash-separated format', () => {
    expect(parseCalendarDate('2024/03/15')).toBeNull()
  })

  it('returns null for a partial string', () => {
    expect(parseCalendarDate('2024.03')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(parseCalendarDate('')).toBeNull()
  })

  it('returns null for null', () => {
    expect(parseCalendarDate(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(parseCalendarDate(undefined)).toBeNull()
  })
})

// ── toCalendarDate ───────────────────────────────────────────────────────────

describe('toCalendarDate', () => {
  it('formats a standard date', () => {
    expect(toCalendarDate(2024, 3, 15)).toBe('2024.03.15')
  })

  it('pads single-digit month with a leading zero', () => {
    expect(toCalendarDate(2026, 1, 20)).toBe('2026.01.20')
  })

  it('pads single-digit day with a leading zero', () => {
    expect(toCalendarDate(2026, 12, 5)).toBe('2026.12.05')
  })

  it('pads both month and day when both are single-digit', () => {
    expect(toCalendarDate(2024, 1, 5)).toBe('2024.01.05')
  })

  it('round-trips with parseCalendarDate', () => {
    const original = '2026.05.14'
    const { year, month, day } = parseCalendarDate(original)
    expect(toCalendarDate(year, month, day)).toBe(original)
  })
})

// ── buildDayGrid ─────────────────────────────────────────────────────────────

describe('buildDayGrid', () => {
  it('always returns an array whose length is a multiple of 7', () => {
    // Test several months with different starting weekdays and lengths.
    const cases = [
      [2024, 1], // Jan 2024 — starts Monday
      [2024, 2], // Feb 2024 — starts Thursday, leap year (29 days)
      [2023, 12], // Dec 2023 — starts Friday
      [2025, 2], // Feb 2025 — starts Saturday, 28 days
      [2026, 3], // Mar 2026 — starts Sunday
    ]
    for (const [y, m] of cases) {
      const cells = buildDayGrid(y, m)
      expect(cells.length % 7, `${y}.${m}: length ${cells.length}`).toBe(0)
    }
  })

  it('contains exactly totalDays non-null entries', () => {
    const cases = [
      { year: 2024, month: 1, total: 31 },
      { year: 2024, month: 2, total: 29 }, // leap
      { year: 2023, month: 2, total: 28 }, // non-leap
      { year: 2024, month: 4, total: 30 },
    ]
    for (const { year, month, total } of cases) {
      const cells = buildDayGrid(year, month)
      const days = cells.filter((c) => c !== null)
      expect(days.length, `${year}.${month}`).toBe(total)
    }
  })

  it('starts with day 1 as the first non-null cell', () => {
    const cells = buildDayGrid(2024, 3)
    const first = cells.find((c) => c !== null)
    expect(first).toBe(1)
  })

  it('ends with the last day of the month as the last non-null cell', () => {
    const cells = buildDayGrid(2024, 1) // January has 31 days
    const last = [...cells].reverse().find((c) => c !== null)
    expect(last).toBe(31)
  })

  it('places null cells before day 1 for a Monday-start month (Jan 2024, offset 0)', () => {
    // Jan 1 2024 is a Monday → offset = 0, no leading nulls.
    const cells = buildDayGrid(2024, 1)
    expect(cells[0]).toBe(1)
  })

  it('places the correct number of leading nulls for a Thursday-start month (Feb 2024, offset 3)', () => {
    // Feb 1 2024 is a Thursday → offset = 3 (Mon=0,Tue=1,Wed=2,Thu=3).
    const cells = buildDayGrid(2024, 2)
    expect(cells[0]).toBeNull()
    expect(cells[1]).toBeNull()
    expect(cells[2]).toBeNull()
    expect(cells[3]).toBe(1)
  })

  it('places the correct number of leading nulls for a Friday-start month (Dec 2023, offset 4)', () => {
    // Dec 1 2023 is a Friday → offset = 4.
    const cells = buildDayGrid(2023, 12)
    expect(cells.slice(0, 4).every((c) => c === null)).toBe(true)
    expect(cells[4]).toBe(1)
  })

  it('places the correct number of leading nulls for a Sunday-start month (Mar 2026, offset 6)', () => {
    // Mar 1 2026 is a Sunday → offset = 6 (last column in Mon-first grid).
    const cells = buildDayGrid(2026, 3)
    expect(cells.slice(0, 6).every((c) => c === null)).toBe(true)
    expect(cells[6]).toBe(1)
  })

  it('day numbers form a consecutive sequence from 1 to totalDays', () => {
    const cells = buildDayGrid(2024, 5) // May 2024, 31 days
    const days = cells.filter((c) => c !== null)
    expect(days).toEqual(Array.from({ length: 31 }, (_, i) => i + 1))
  })
})

// ── nextCalView ──────────────────────────────────────────────────────────────

describe('nextCalView', () => {
  it('advances from days to months', () => {
    expect(nextCalView('days')).toBe('months')
  })

  it('advances from months to years', () => {
    expect(nextCalView('months')).toBe('years')
  })

  it('cycles from years back to days', () => {
    expect(nextCalView('years')).toBe('days')
  })

  it('completes a full cycle back to the starting view', () => {
    const start = 'days'
    const after3 = nextCalView(nextCalView(nextCalView(start)))
    expect(after3).toBe(start)
  })
})
