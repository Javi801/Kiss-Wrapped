// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({ text: '#111111', textSoft: '#777777' }) }))

import TopPersonTile from '@/components/shared/TopPersonTile'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en
const people = (count) =>
  Array.from({ length: count }, (_, index) => ({ label: `Person ${index + 1}`, value: 4 }))

let container
let root

function render(topPeople) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<TopPersonTile label="Top person" topPeople={topPeople} t={t} />)
  })
}

const text = () => container.textContent
const scroller = () => container.querySelector('.top-person-scroll')
const dots = () =>
  [...container.querySelectorAll('div')].filter((node) => node.style.borderRadius === '50%')

function scrollToSlide(index) {
  const element = scroller()
  Object.defineProperty(element, 'offsetWidth', { configurable: true, value: 200 })
  element.scrollLeft = index * 200
  act(() => {
    element.dispatchEvent(new Event('scroll'))
  })
}

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('TopPersonTile', () => {
  it('shows a dash when nobody has events', () => {
    render([])
    expect(text()).toContain('Top person')
    expect(text()).toContain('—')
    expect(scroller()).toBeNull()
    expect(dots()).toHaveLength(0)
  })

  it('shows the single top person without tie indicators', () => {
    render([{ label: 'Ana', value: 9 }])
    expect(text()).toContain('9')
    expect(text()).toContain('Ana')
    expect(text()).not.toContain(t.tiedForTop)
    expect(dots()).toHaveLength(0)
  })

  it('announces how many people are tied', () => {
    render(people(3))
    expect(text()).toContain(`3 ${t.tiedForTop}`)
    expect(text()).toContain('Person 1')
    expect(text()).toContain('Person 3')
  })

  it('shows one dot per tied person with the first one active', () => {
    render(people(3))
    expect(dots().map((dot) => dot.style.opacity)).toEqual(['1', '0.3', '0.3'])
  })

  it('moves the active dot when the list is scrolled', () => {
    render(people(3))
    scrollToSlide(2)
    expect(dots().map((dot) => dot.style.opacity)).toEqual(['0.3', '0.3', '1'])
  })

  it('still uses dots at the limit of seven people', () => {
    render(people(7))
    expect(dots()).toHaveLength(7)
  })

  it('switches to a position counter above seven people', () => {
    render(people(8))
    expect(dots()).toHaveLength(0)
    expect(text()).toContain('1 / 8')
  })

  it('updates the position counter when the list is scrolled', () => {
    render(people(8))
    scrollToSlide(4)
    expect(text()).toContain('5 / 8')
  })
})
