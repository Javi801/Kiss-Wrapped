// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/charts/FullscreenChartWrapper', () => ({
  default: ({ children }) => children,
}))

import MultiYearTopCard from '@/components/charts/MultiYearTopCard'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

const top3 = [
  {
    label: 'Ana',
    value: 3,
    totalEvents: 5,
    years: ['2021', '2022', '2023'],
    yearCounts: { 2021: 1, 2022: 3, 2023: 1 },
  },
  {
    label: 'Bob',
    value: 2,
    totalEvents: 2,
    years: ['2020', '2024'],
    yearCounts: { 2020: 1, 2024: 1 },
  },
  { label: 'Cy', value: 1, totalEvents: 1, years: ['2019'], yearCounts: { 2019: 1 } },
]

let container
let root

function render(items) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<MultiYearTopCard top3={items} t={t} />)
  })
}

const rows = () => [...container.querySelectorAll('button')]
const click = (index) =>
  act(() => {
    rows()[index].dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('MultiYearTopCard', () => {
  it('shows the empty message without multi-year people', () => {
    render([])
    expect(container.textContent).toContain(t.noMultiYearPeopleYet)
    expect(rows()).toHaveLength(0)
  })

  it('lists the people in the given order with gold, silver and bronze', () => {
    render(top3)
    const labels = rows().map((row) => row.textContent)
    expect(labels[0]).toContain('🥇')
    expect(labels[0]).toContain('Ana')
    expect(labels[1]).toContain('🥈')
    expect(labels[1]).toContain('Bob')
    expect(labels[2]).toContain('🥉')
    expect(labels[2]).toContain('Cy')
  })

  it('summarizes each person with plural units', () => {
    render(top3)
    expect(rows()[0].textContent).toContain(`3 ${t.years} · 5 ${t.chartEvents}`)
  })

  it('uses singular units for one year and one event', () => {
    render(top3)
    expect(rows()[2].textContent).toContain(`1 ${t.chartYear} · 1 ${t.chartEvent}`)
  })

  it('keeps the yearly breakdown collapsed at first', () => {
    render(top3)
    expect(container.textContent).not.toContain('2022')
  })

  it('expands the yearly breakdown of the tapped person', () => {
    render(top3)
    click(0)
    expect(container.textContent).toContain(`2021` + `1 ${t.chartEvent}`)
    expect(container.textContent).toContain(`2022` + `3 ${t.chartEvents}`)
    expect(container.textContent).not.toContain('2024')
  })

  it('collapses the breakdown when tapped again', () => {
    render(top3)
    click(0)
    click(0)
    expect(container.textContent).not.toContain('2022')
  })

  it('keeps a single breakdown open at a time', () => {
    render(top3)
    click(0)
    click(1)
    expect(container.textContent).toContain('2024')
    expect(container.textContent).not.toContain('2022')
  })
})
