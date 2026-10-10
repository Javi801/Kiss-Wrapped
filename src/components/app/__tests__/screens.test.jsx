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
import OnboardingWizard from '@/components/app/OnboardingWizard'

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

  it('hides the entry guide by default', () => {
    render(<IntroScreen onOpenMain={() => {}} t={t} />)
    expect(container.textContent).not.toContain(t.entryGuideTitle)
    expect(container.textContent).not.toContain('👆')
  })

  it('shows the entry guide callout and the tapping hand when asked', () => {
    render(<IntroScreen onOpenMain={() => {}} showEntryGuide t={t} />)
    expect(container.querySelector('h2').textContent).toBe(t.entryGuideTitle)
    expect(container.textContent).toContain(t.entryGuideBody)
    expect(container.textContent).toContain('👆')
  })

  it('keeps the animated hints out of the accessibility tree and of the way of taps', () => {
    render(<IntroScreen onOpenMain={() => {}} showEntryGuide t={t} />)
    const hints = [...container.querySelectorAll('[aria-hidden="true"]')]
    expect(hints).toHaveLength(2)
    for (const hint of hints) expect(hint.style.pointerEvents).toBe('none')
  })

  it('still opens the app from the heart while the entry guide is shown', () => {
    const onOpenMain = vi.fn()
    render(<IntroScreen onOpenMain={onOpenMain} showEntryGuide t={t} />)
    expect(container.querySelectorAll('button, a')).toHaveLength(1)
    click(container.querySelector(`button[aria-label="${t.hiddenAccess}"]`))
    expect(onOpenMain).toHaveBeenCalledOnce()
  })
})

describe('OnboardingWizard', () => {
  it('completes from the finish button', () => {
    const onComplete = vi.fn()
    render(<OnboardingWizard t={t} onComplete={onComplete} />)
    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0].textContent).toBe(t.onboardingFinish)
    click(buttons[0])
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('shows the welcome step first', () => {
    render(<OnboardingWizard t={t} onComplete={() => {}} />)
    expect(container.querySelector('h1').textContent).toBe(t.onboardingWelcomeTitle)
    const paragraphs = [...container.querySelectorAll('p')].map((p) => p.textContent)
    expect(paragraphs).toEqual([t.onboardingWelcomeLead, t.onboardingWelcomePrivacy])
  })

  it('derives the step counter total from the number of steps', () => {
    const steps = [() => <i>one</i>, () => <i>two</i>, () => <i>three</i>]
    render(<OnboardingWizard t={t} onComplete={() => {}} steps={steps} />)
    expect(container.textContent).toContain(
      t.onboardingStepCount.replace('{current}', 1).replace('{total}', 3)
    )
  })

  it('advances with the next button and completes only on the last step', () => {
    const onComplete = vi.fn()
    const steps = [() => <i>one</i>, () => <i>two</i>]
    render(<OnboardingWizard t={t} onComplete={onComplete} steps={steps} />)
    const button = container.querySelector('button')
    expect(container.querySelector('i').textContent).toBe('one')
    expect(button.textContent).toBe(t.onboardingNext)

    click(button)
    expect(onComplete).not.toHaveBeenCalled()
    expect(container.querySelector('i').textContent).toBe('two')
    expect(container.textContent).toContain(
      t.onboardingStepCount.replace('{current}', 2).replace('{total}', 2)
    )
    expect(button.textContent).toBe(t.onboardingFinish)

    click(button)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('passes the translations to the current step', () => {
    const steps = [({ t: stepT }) => <i>{stepT.onboardingNext}</i>]
    render(<OnboardingWizard t={t} onComplete={() => {}} steps={steps} />)
    expect(container.querySelector('i').textContent).toBe(t.onboardingNext)
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

  it('leaves the partner fields out of the add form', () => {
    render(<AddPersonScreen onSave={() => {}} onBack={() => {}} t={t} language="en" />)
    expect(form.props.includePartner).toBeUndefined()
  })
})
