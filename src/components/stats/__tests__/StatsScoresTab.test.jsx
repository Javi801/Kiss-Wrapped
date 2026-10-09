import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { COPY } from '@/lib/constants'

const charts = vi.hoisted(() => ({ pie: null, bar: null }))

vi.mock('@/components/charts/PieChartCard', () => ({
  default: (props) => {
    charts.pie = props
    return null
  },
}))
vi.mock('@/components/charts/BarChartCard', () => ({
  default: (props) => {
    charts.bar = props
    return null
  },
}))

import StatsScoresTab from '@/components/stats/StatsScoresTab'

const t = COPY.en
const event = (score) => ({ id: `e-${score}-${Math.random()}`, date: '2024.01.01', score })
const render = (allEvents) => renderToStaticMarkup(<StatsScoresTab allEvents={allEvents} t={t} />)
const valueOf = (rows, label) => rows.find((row) => row.label === label)?.value

describe('StatsScoresTab', () => {
  beforeEach(() => {
    charts.pie = null
    charts.bar = null
  })

  it('splits events into scored and unscored for the pie chart', () => {
    render([event(3), event(5), event(null), event(null), event(null)])
    expect(valueOf(charts.pie.data, t.scores)).toBe(2)
    expect(valueOf(charts.pie.data, t.noScore)).toBe(3)
  })

  it('counts a zero score as scored', () => {
    render([event(0), event(null)])
    expect(valueOf(charts.pie.data, t.scores)).toBe(1)
    expect(valueOf(charts.pie.data, t.noScore)).toBe(1)
  })

  it('shows only the scores that were actually given in the distribution', () => {
    render([event(2), event(2), event(5)])
    expect(charts.bar.data.map((row) => row.value).sort()).toEqual([1, 2])
    expect(charts.bar.data.every((row) => row.value > 0)).toBe(true)
  })

  it('leaves zero and missing scores out of the distribution', () => {
    render([event(0), event(null), event(4)])
    expect(charts.bar.data).toHaveLength(1)
    expect(charts.bar.data[0].value).toBe(1)
  })

  it('passes empty data and the empty text when there are no events', () => {
    render([])
    expect(charts.bar.data).toEqual([])
    expect(charts.pie.data.every((row) => row.value === 0)).toBe(true)
    expect(charts.pie.emptyText).toBe(t.noDataYet)
    expect(charts.bar.emptyText).toBe(t.noDataYet)
  })

  it('labels both charts in events', () => {
    render([event(1)])
    const unit = { one: t.chartEvent, many: t.chartEvents }
    expect(charts.pie.tooltipUnit).toEqual(unit)
    expect(charts.bar.tooltipUnit).toEqual(unit)
  })
})
