import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import AgeRangeBox from '@/components/stats/AgeRangeBox'
import { getYearKey, calculateAgeAtEvent } from '@/lib/date'
import FullscreenChartWrapper from '@/components/charts/FullscreenChartWrapper'

// Resolves the canonical age for a person within a year's events.
// Uses the age with the most events; on a tie, picks the higher age.
// Falls back to person.age when no age can be derived from events.
function resolveAgeForYear(person, events) {
  const ageCount = new Map()
  for (const event of events) {
    const age = calculateAgeAtEvent(person.birthYear, person.zodiacSign, event.date)
    if (age === null || !Number.isFinite(age)) continue
    ageCount.set(age, (ageCount.get(age) || 0) + 1)
  }
  if (!ageCount.size) return person.age ?? null
  let bestAge = null
  let bestCount = 0
  for (const [age, count] of ageCount) {
    if (count > bestCount || (count === bestCount && age > bestAge)) {
      bestAge = age
      bestCount = count
    }
  }
  return bestAge
}

// Linear interpolation quantile (R-7 / numpy default).
function quantileFromSorted(sorted, p) {
  if (sorted.length === 1) return sorted[0]
  const idx = p * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

// Compute a nice axis with evenly-spaced ticks that encompass [dataMin, dataMax].
function niceAxis(dataMin, dataMax) {
  const dataRange = dataMax - dataMin
  let step = 1
  if (dataRange > 0) {
    const rawStep = dataRange / 4
    if (rawStep <= 1) step = 1
    else if (rawStep <= 2) step = 2
    else if (rawStep <= 5) step = 5
    else if (rawStep <= 10) step = 10
    else step = Math.ceil(rawStep / 5) * 5
  }
  const axisMin = Math.floor(dataMin / step) * step
  const axisMax =
    Math.ceil(dataMax / step) * step === axisMin ? axisMin + step : Math.ceil(dataMax / step) * step
  const axisRange = axisMax - axisMin
  const tickValues = []
  for (let v = axisMin; v <= axisMax; v += step) tickValues.push(v)
  const toPos = (v) => 3 + ((v - axisMin) / axisRange) * 94
  return { tickValues, toPos }
}

export default function AgeRangeCard({ title, people, emptyText, t }) {
  const PALETTE = usePalette()
  const [splitByYear, setSplitByYear] = useState(false)

  const yearsData = useMemo(() => {
    // yearsMap: year -> Map<personId, { person, events[] }>
    const yearsMap = new Map()

    for (const person of people) {
      for (const event of person.events || []) {
        const year = getYearKey(event.date)
        if (!year) continue
        if (!yearsMap.has(year)) yearsMap.set(year, new Map())
        const yearMap = yearsMap.get(year)
        if (!yearMap.has(person.id)) yearMap.set(person.id, { person, events: [] })
        yearMap.get(person.id).events.push(event)
      }
    }

    return [...yearsMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, personMap]) => {
        const personData = [...personMap.values()]
        return {
          year,
          people: personData.map(({ person }) => person),
          personData,
        }
      })
  }, [people])

  // Unique persons across all years.
  const combinedPeople = useMemo(
    () =>
      Array.from(new Map(yearsData.flatMap(({ people: yp }) => yp).map((p) => [p.id, p])).values()),
    [yearsData]
  )

  // Shared axis and per-year boxplot rows for the multi-year view.
  const multiYear = useMemo(() => {
    // Axis range covers all per-year ages across every year.
    const allAges = yearsData
      .flatMap(({ personData }) =>
        personData.map(({ person, events }) => resolveAgeForYear(person, events))
      )
      .filter(Number.isFinite)
      .sort((a, b) => a - b)
    if (!allAges.length) return null

    const { tickValues, toPos } = niceAxis(allAges[0], allAges[allAges.length - 1])

    const rows = yearsData
      .map(({ year, personData }) => {
        const sorted = personData
          .map(({ person, events }) => resolveAgeForYear(person, events))
          .filter(Number.isFinite)
          .sort((a, b) => a - b)
        if (!sorted.length) return null
        const q1 = quantileFromSorted(sorted, 0.25)
        const q3 = quantileFromSorted(sorted, 0.75)
        const boxLeft = toPos(q1)
        return {
          year,
          minPos: toPos(sorted[0]),
          maxPos: toPos(sorted[sorted.length - 1]),
          boxLeft,
          boxWidth: Math.max(toPos(q3) - boxLeft, 0.5),
          medianPos: toPos(quantileFromSorted(sorted, 0.5)),
        }
      })
      .filter(Boolean)

    return { tickValues, toPos, rows }
  }, [yearsData])

  return (
    <FullscreenChartWrapper>
      <Card
        className="rounded-3xl"
        style={{
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          backdropFilter: 'blur(8px)',
          borderColor: PALETTE.cardBorder,
          backgroundColor: PALETTE.cardBg,
        }}
      >
        <CardHeader style={{ paddingBottom: '0.5rem' }}>
          <CardTitle style={{ ...TEXT.title, color: PALETTE.text }}>{title}</CardTitle>
          <CardDescription style={{ color: PALETTE.textSoft }}>
            {splitByYear ? t.agesAsOfYear : t.allYears}
          </CardDescription>
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              padding: '0.25rem',
              background: PALETTE.accentMuted,
              borderRadius: '0.875rem',
              marginTop: '0.5rem',
            }}
          >
            {[
              { label: t.showAllTogether, value: false },
              { label: t.divideByYear, value: true },
            ].map(({ label, value }) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setSplitByYear(value)}
                style={{
                  flex: 1,
                  padding: '0.3rem 0',
                  borderRadius: '0.625rem',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: splitByYear === value ? 600 : 400,
                  background:
                    splitByYear === value
                      ? `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`
                      : 'transparent',
                  color: splitByYear === value ? 'white' : PALETTE.textSoft,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {!splitByYear ? (
            <AgeRangeBox
              title={title}
              subtitle={t.allYears}
              people={combinedPeople}
              emptyText={emptyText}
              bare
            />
          ) : multiYear && multiYear.rows.length ? (
            // Multi-year chart: shared X-axis, one boxplot row per year.
            <div
              className="rounded-3xl"
              style={{ padding: '1.25rem', backgroundColor: PALETTE.surfaceBg }}
            >
              {multiYear.rows.map(({ year, minPos, maxPos, boxLeft, boxWidth, medianPos }) => (
                <div
                  key={year}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  {/* Year label (Y-axis) */}
                  <div
                    style={{
                      width: '2rem',
                      textAlign: 'right',
                      flexShrink: 0,
                      ...TEXT.body,
                      fontWeight: '500',
                      color: PALETTE.textSoft,
                    }}
                  >
                    {year}
                  </div>

                  {/* Boxplot row */}
                  <div style={{ position: 'relative', flex: 1, height: '2rem' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '3%',
                        right: '3%',
                        top: '50%',
                        height: '1px',
                        transform: 'translateY(-50%)',
                        backgroundColor: PALETTE.line,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        height: '1.25rem',
                        width: '2px',
                        transform: 'translateY(-50%)',
                        left: `${minPos}%`,
                        backgroundColor: PALETTE.accent,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        height: '1.25rem',
                        width: '2px',
                        transform: 'translateY(-50%)',
                        left: `${maxPos}%`,
                        backgroundColor: PALETTE.accent,
                      }}
                    />
                    <div
                      className="rounded-sm"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        height: '1.25rem',
                        transform: 'translateY(-50%)',
                        border: `2px solid ${PALETTE.accent}`,
                        left: `${boxLeft}%`,
                        width: `${boxWidth}%`,
                        backgroundColor: PALETTE.accentSoft,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        height: '1.5rem',
                        width: '2px',
                        transform: 'translateY(-50%)',
                        left: `${medianPos}%`,
                        backgroundColor: PALETTE.accentEmphasis,
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Shared X-axis labels */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: '2rem', flexShrink: 0 }} />
                <div style={{ position: 'relative', flex: 1, height: '1.25rem' }}>
                  {multiYear.tickValues.map((v, i) => {
                    const pct = multiYear.toPos(v)
                    const isFirst = i === 0
                    const isLast = i === multiYear.tickValues.length - 1
                    return (
                      <span
                        key={v}
                        style={{
                          position: 'absolute',
                          left: `${pct}%`,
                          transform: isFirst
                            ? 'none'
                            : isLast
                              ? 'translateX(-100%)'
                              : 'translateX(-50%)',
                          ...TEXT.body,
                          fontWeight: '500',
                          color: PALETTE.accentEmphasis,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {v}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl"
              style={{
                border: `1px dashed ${PALETTE.inputBorder}`,
                padding: '2rem',
                textAlign: 'center',
                ...TEXT.body,
                color: PALETTE.textSoft,
              }}
            >
              {emptyText}
            </div>
          )}
        </CardContent>
      </Card>
    </FullscreenChartWrapper>
  )
}
