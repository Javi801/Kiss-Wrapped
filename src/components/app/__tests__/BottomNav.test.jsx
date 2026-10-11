// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))

import BottomNav from '@/components/app/BottomNav'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

let container
let root

function render(props = {}) {
  const onNavigate = vi.fn()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<BottomNav screen="main" onNavigate={onNavigate} t={t} {...props} />)
  })
  return onNavigate
}

const buttons = () => [...container.querySelectorAll('button')]

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('BottomNav', () => {
  it('lists the four main screens', () => {
    render()
    expect(buttons().map((button) => button.textContent)).toEqual([
      t.home,
      t.add,
      t.people,
      t.stats,
    ])
  })

  it('reports the tapped screen', () => {
    const onNavigate = render()
    act(() => buttons()[2].click())
    expect(onNavigate).toHaveBeenCalledWith('people')
  })

  it('highlights only the active screen', () => {
    render({ screen: 'stats' })
    expect(buttons().map((button) => button.style.color)).toEqual([
      '',
      '',
      '',
      'rgb(255, 255, 255)',
    ])
  })

  it('shows no tap guide by default', () => {
    render()
    expect(container.textContent).not.toContain('👆')
  })

  it('puts the tap guide on the guided item', () => {
    render({ screen: 'people', guideTarget: 'main' })
    expect(buttons()[0].textContent).toContain('👆')
    expect(buttons()[0].style.position).toBe('relative')
    expect(buttons()[2].textContent).not.toContain('👆')
  })

  it('marks no item as a tour target by default', () => {
    render()
    expect(container.querySelector('[data-tour-target]')).toBeNull()
    expect(buttons().map((button) => button.style.pointerEvents)).toEqual(['', '', '', ''])
  })

  it('leaves only the guided item reachable for the tour, and still tappable', () => {
    const onNavigate = render({ screen: 'people', guideTarget: 'main' })
    expect([...container.querySelectorAll('[data-tour-target]')]).toEqual([buttons()[0]])
    expect(buttons().map((button) => button.style.pointerEvents)).toEqual(['auto', '', '', ''])
    act(() => buttons()[0].click())
    expect(onNavigate).toHaveBeenCalledWith('main')
  })
})
