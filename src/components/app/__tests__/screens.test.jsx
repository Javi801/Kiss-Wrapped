// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

const form = vi.hoisted(() => ({ props: null }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/visuals/HeroVisualPlaceholder', () => ({ default: () => null }))
vi.mock('@/components/visuals/InteractiveBubbles', () => ({ default: () => null }))
vi.mock('@/components/forms/PersonForm', () => ({
  default: (props) => {
    form.props = props
    return null
  },
}))

import IntroScreen from '@/components/app/IntroScreen'
import AddPersonScreen from '@/components/app/AddPersonScreen'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

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

const click = (node) =>
  act(() => {
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

beforeEach(() => {
  form.props = null
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('IntroScreen', () => {
  it('opens the app from the hidden access button', () => {
    const onOpenMain = vi.fn()
    render(<IntroScreen onOpenMain={onOpenMain} t={t} />)
    const hidden = container.querySelector(`button[aria-label="${t.hiddenAccess}"]`)
    expect(hidden).not.toBeNull()
    click(hidden)
    expect(onOpenMain).toHaveBeenCalledOnce()
  })

  it('exposes no other way into the app', () => {
    render(<IntroScreen onOpenMain={() => {}} t={t} />)
    expect(container.querySelectorAll('button, a')).toHaveLength(1)
  })
})

describe('AddPersonScreen', () => {
  it('goes back from the back button', () => {
    const onBack = vi.fn()
    render(<AddPersonScreen onSave={() => {}} onBack={onBack} t={t} language="en" />)
    const back = [...container.querySelectorAll('button')].find((button) =>
      button.textContent.includes(t.back)
    )
    click(back)
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('opens the person form in add mode, wired to save and back', () => {
    const onSave = vi.fn()
    const onBack = vi.fn()
    render(<AddPersonScreen onSave={onSave} onBack={onBack} t={t} language="es" />)
    expect(form.props).toMatchObject({
      onSave,
      onCancel: onBack,
      mode: 'add',
      language: 'es',
      includeHowWeMet: false,
      saveLabel: t.saveAndBack,
    })
  })
})
