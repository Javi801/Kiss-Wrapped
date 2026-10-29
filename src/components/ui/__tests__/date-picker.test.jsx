// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))

import { DatePicker } from '@/components/ui/date-picker'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const SCREEN_WIDTH = 400

let container
let root

// Renders the picker with its left edge at `left` and opens the calendar.
function openAt(left) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<DatePicker value="" onChange={() => {}} />)
  })
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(SCREEN_WIDTH)
  vi.spyOn(container.firstChild, 'getBoundingClientRect').mockReturnValue({ left })
  act(() => container.querySelector('button[aria-label="Open calendar"]').click())
}

// The calendar dropdown is the last child of the picker.
const calendar = () => container.firstChild.lastChild

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

describe('DatePicker — calendar position', () => {
  it('opens toward the right when it fits', () => {
    openAt(16)
    expect(calendar().style.left).toBe('0px')
    expect(calendar().style.right).toBe('')
  })

  it('opens toward the left when it would overflow the right edge', () => {
    openAt(SCREEN_WIDTH / 2)
    expect(calendar().style.right).toBe('0px')
    expect(calendar().style.left).toBe('')
  })

  it('measures again every time it opens', () => {
    openAt(SCREEN_WIDTH / 2)
    const toggle = container.querySelector('button[aria-label="Open calendar"]')
    act(() => toggle.click())
    container.firstChild.getBoundingClientRect.mockReturnValue({ left: 16 })
    act(() => toggle.click())
    expect(calendar().style.left).toBe('0px')
  })
})
