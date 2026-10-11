// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, createRef } from 'react'
import { createRoot } from 'react-dom/client'

const palette = vi.hoisted(() => ({
  accentEmphasis2: 'rgb(1, 1, 1)',
  textSoft: 'rgb(2, 2, 2)',
}))

vi.mock('@/lib/theme', () => ({ usePalette: () => palette }))

import OnboardingFormStep from '@/components/app/OnboardingFormStep'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container
let root

function render(element) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(element)
  })
}

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('OnboardingFormStep', () => {
  it('shows the title and the body, colored from the palette', () => {
    render(<OnboardingFormStep title="A title" body="A body" />)
    const title = container.querySelector('h1')
    const body = container.querySelector('p')
    expect(title.textContent).toBe('A title')
    expect(title.style.color).toBe(palette.accentEmphasis2)
    expect(body.textContent).toBe('A body')
    expect(body.style.color).toBe(palette.textSoft)
    expect(container.querySelectorAll('h1, p')).toHaveLength(2)
  })

  it('shows its children under the header, in the same column', () => {
    render(
      <OnboardingFormStep title="A title" body="A body">
        <form id="person" />
      </OnboardingFormStep>
    )
    const column = container.firstElementChild
    const form = container.querySelector('form')
    expect(form.parentElement).toBe(column)
    expect(column.lastElementChild).toBe(form)
    expect(column.firstElementChild.contains(container.querySelector('h1'))).toBe(true)
    expect(column.firstElementChild.contains(form)).toBe(false)
  })

  it('hands the column to the container ref', () => {
    const containerRef = createRef()
    render(
      <OnboardingFormStep title="A title" body="A body" containerRef={containerRef}>
        <form />
      </OnboardingFormStep>
    )
    expect(containerRef.current).toBe(container.firstElementChild)
    expect(containerRef.current.contains(container.querySelector('form'))).toBe(true)
  })

  it('renders without a container ref', () => {
    expect(() => render(<OnboardingFormStep title="A title" body="A body" />)).not.toThrow()
    expect(container.firstElementChild.style.maxWidth).toBe('28rem')
  })
})
