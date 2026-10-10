// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({ accent: 'rgb(1, 2, 3)' }) }))

import TimelineCalendarPopup from '@/components/charts/timeline/TimelineCalendarPopup'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Wednesday 12 June 2024; its week starts on Monday 10 June.
const NOW = new Date(2024, 5, 12, 12, 0, 0)

let container
let root
let onOffsetChange

function render(gran, offset = 0) {
  onOffsetChange = vi.fn()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <TimelineCalendarPopup
        gran={gran}
        offset={offset}
        onOffsetChange={onOffsetChange}
        locale="en-GB"
        title="Period title"
      />
    )
  })
}

const trigger = () => container.querySelector('button')
// The dropdown is portalled to the body: prev, title and next come first, then the grid.
const dropdownButtons = () =>
  [...document.body.querySelectorAll('button')].filter((item) => !container.contains(item))
const isOpen = () => dropdownButtons().length > 0
const prev = () => dropdownButtons()[0]
const heading = () => dropdownButtons()[1]
const next = () => dropdownButtons()[2]
const grid = () => dropdownButtons().slice(3)
const cell = (label) => grid().find((item) => item.textContent === String(label))
const enabled = () =>
  grid()
    .filter((item) => !item.disabled)
    .map((item) => item.textContent)
const click = (node) => act(() => node.click())
const open = () => click(trigger())

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

describe('TimelineCalendarPopup — opening and closing', () => {
  it('shows the period title and starts closed', () => {
    render('week')
    expect(trigger().textContent).toBe('Period title')
    expect(isOpen()).toBe(false)
  })

  it('toggles from the title', () => {
    render('week')
    open()
    expect(isOpen()).toBe(true)
    open()
    expect(isOpen()).toBe(false)
  })

  it('closes when pressing outside', () => {
    render('week')
    open()
    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })
    expect(isOpen()).toBe(false)
  })

  it('stays open when pressing inside the calendar', () => {
    render('week')
    open()
    act(() => {
      heading().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })
    expect(isOpen()).toBe(true)
  })
})

describe('TimelineCalendarPopup — picking a week', () => {
  it('opens on the days of the current month', () => {
    render('week')
    open()
    expect(heading().textContent).toBe('June 2024')
    expect(grid()).toHaveLength(30)
  })

  it('disables the days after today', () => {
    render('week')
    open()
    expect(enabled()).toEqual(Array.from({ length: 12 }, (_, i) => String(i + 1)))
  })

  it.each([
    [12, 0],
    [10, 0],
    [9, -1],
    [3, -1],
    [2, -2],
  ])('selects the week of day %i as offset %i', (day, offset) => {
    render('week')
    open()
    click(cell(day))
    expect(onOffsetChange).toHaveBeenCalledWith(offset)
    expect(isOpen()).toBe(false)
  })

  it('ignores a day in the future', () => {
    render('week')
    open()
    click(cell(20))
    expect(onOffsetChange).not.toHaveBeenCalled()
    expect(isOpen()).toBe(true)
  })

  it('reaches earlier weeks through the previous month', () => {
    render('week')
    open()
    click(prev())
    expect(heading().textContent).toBe('May 2024')
    expect(enabled()).toHaveLength(31)
    // 1 May 2024 belongs to the week of Monday 29 April, six weeks back.
    click(cell(1))
    expect(onOffsetChange).toHaveBeenCalledWith(-6)
  })

  it('cannot move past the current month', () => {
    render('week')
    open()
    expect(next().disabled).toBe(true)
    click(prev())
    expect(next().disabled).toBe(false)
    click(next())
    expect(heading().textContent).toBe('June 2024')
  })

  it('opens on the month of the week being shown', () => {
    render('week', -6)
    open()
    expect(heading().textContent).toBe('April 2024')
  })

  it('crosses the year boundary in both directions', () => {
    // 23 weeks back is the week of Monday 1 January 2024.
    render('week', -23)
    open()
    expect(heading().textContent).toBe('January 2024')
    click(prev())
    expect(heading().textContent).toBe('December 2023')
    click(next())
    expect(heading().textContent).toBe('January 2024')
  })

  it('highlights the week being shown', () => {
    render('week', -1)
    open()
    const highlighted = grid()
      .filter((item) => item.style.backgroundColor === 'rgb(1, 2, 3)')
      .map((item) => item.textContent)
    expect(highlighted).toEqual(['3', '4', '5', '6', '7', '8', '9'])
  })

  it('zooms out to months and years from the heading, then back to days', () => {
    render('week')
    open()
    click(heading())
    expect(heading().textContent).toBe('2024')
    expect(grid()).toHaveLength(12)
    click(heading())
    expect(heading().textContent).toBe('2018 – 2029')
    click(heading())
    expect(heading().textContent).toBe('June 2024')
  })

  it('drills from a year to a month to its days', () => {
    render('week')
    open()
    click(heading())
    click(heading())
    click(cell(2022))
    expect(heading().textContent).toBe('2022')
    click(cell('Mar'))
    expect(heading().textContent).toBe('March 2022')
    expect(onOffsetChange).not.toHaveBeenCalled()
    expect(isOpen()).toBe(true)
  })

  it('disables the months after the current one', () => {
    render('week')
    open()
    click(heading())
    expect(enabled()).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'])
  })
})

describe('TimelineCalendarPopup — picking a month', () => {
  it('opens on the months of the current year', () => {
    render('month')
    open()
    expect(heading().textContent).toBe('2024')
    expect(grid()).toHaveLength(12)
  })

  it.each([
    ['Jun', 0],
    ['Mar', -3],
    ['Jan', -5],
  ])('selects %s as offset %i', (month, offset) => {
    render('month')
    open()
    click(cell(month))
    expect(onOffsetChange).toHaveBeenCalledWith(offset)
    expect(isOpen()).toBe(false)
  })

  it('ignores a month in the future', () => {
    render('month')
    open()
    click(cell('Sept'))
    expect(onOffsetChange).not.toHaveBeenCalled()
  })

  it('counts months across years', () => {
    render('month')
    open()
    expect(next().disabled).toBe(true)
    click(prev())
    expect(heading().textContent).toBe('2023')
    expect(enabled()).toHaveLength(12)
    click(cell('Nov'))
    expect(onOffsetChange).toHaveBeenCalledWith(-7)
  })

  it('opens on the year of the month being shown and highlights it', () => {
    render('month', -6)
    open()
    expect(heading().textContent).toBe('2023')
    expect(cell('Dec').style.backgroundColor).toBe('rgb(1, 2, 3)')
    expect(cell('Nov').style.backgroundColor).not.toBe('rgb(1, 2, 3)')
  })

  it('zooms out to years from the heading and back to months', () => {
    render('month')
    open()
    click(heading())
    expect(heading().textContent).toBe('2018 – 2029')
    click(heading())
    expect(heading().textContent).toBe('2024')
    expect(grid()).toHaveLength(12)
  })

  it('returns to the year it was showing, not the one of the year page', () => {
    render('month')
    open()
    click(prev())
    click(heading())
    click(prev())
    expect(heading().textContent).toBe('2005 – 2016')
    click(heading())
    expect(heading().textContent).toBe('2023')
  })

  it('still selects a month after zooming out and back', () => {
    render('month')
    open()
    click(heading())
    click(heading())
    click(cell('Mar'))
    expect(onOffsetChange).toHaveBeenCalledWith(-3)
  })

  it('picks a year and then a month of it', () => {
    render('month')
    open()
    click(heading())
    click(cell(2022))
    expect(heading().textContent).toBe('2022')
    click(cell('Feb'))
    expect(onOffsetChange).toHaveBeenCalledWith(-28)
  })
})

describe('TimelineCalendarPopup — picking a year', () => {
  it('opens on a page of twelve years around the current one', () => {
    render('year')
    open()
    expect(heading().textContent).toBe('2018 – 2029')
    expect(grid()).toHaveLength(12)
  })

  it('disables the years after the current one', () => {
    render('year')
    open()
    expect(enabled()).toEqual(['2018', '2019', '2020', '2021', '2022', '2023', '2024'])
    expect(next().disabled).toBe(true)
  })

  it.each([
    [2024, 0],
    [2021, -3],
  ])('selects %i as offset %i', (year, offset) => {
    render('year')
    open()
    click(cell(year))
    expect(onOffsetChange).toHaveBeenCalledWith(offset)
    expect(isOpen()).toBe(false)
  })

  it('ignores a year in the future', () => {
    render('year')
    open()
    click(cell(2027))
    expect(onOffsetChange).not.toHaveBeenCalled()
  })

  it('pages back twelve years at a time', () => {
    render('year')
    open()
    click(prev())
    expect(heading().textContent).toBe('2006 – 2017')
    expect(next().disabled).toBe(false)
    click(cell(2010))
    expect(onOffsetChange).toHaveBeenCalledWith(-14)
  })

  it('opens on the page of the year being shown and highlights it', () => {
    render('year', -10)
    open()
    expect(heading().textContent).toBe('2008 – 2019')
    expect(cell(2014).style.backgroundColor).toBe('rgb(1, 2, 3)')
    click(next())
    expect(heading().textContent).toBe('2020 – 2031')
  })

  it('does not zoom from the heading', () => {
    render('year')
    open()
    click(heading())
    expect(heading().textContent).toBe('2018 – 2029')
  })
})
