// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

const form = vi.hoisted(() => ({ props: null }))
const tour = vi.hoisted(() => ({ props: null }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/app/OnboardingTour', () => ({
  default: (props) => {
    tour.props = props
    return <section data-tour="" />
  },
}))
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
import OnboardingPersonStep from '@/components/app/OnboardingPersonStep'

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

// Ends the tour on screen, as its last scene does.
const endTour = () => act(() => tour.props.onDone())

beforeEach(() => {
  form.props = null
  tour.props = null
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
    expect(hints).toHaveLength(3)
    for (const hint of hints) expect(hint.style.pointerEvents).toBe('none')
  })

  it('dims the screen behind the entry guide without blocking taps', () => {
    render(<IntroScreen onOpenMain={() => {}} t={t} />)
    expect(container.querySelector('[data-entry-backdrop]')).toBeNull()
    act(() => root.unmount())
    container.remove()

    render(<IntroScreen onOpenMain={() => {}} showEntryGuide t={t} />)
    const backdrop = container.querySelector('[data-entry-backdrop]')
    expect(backdrop.style.pointerEvents).toBe('none')
    // Below the heart wrapper, which keeps the guide and the heart on top.
    expect(Number(backdrop.style.zIndex)).toBeLessThan(10)
  })

  it('still opens the app from the heart while the entry guide is shown', () => {
    const onOpenMain = vi.fn()
    render(<IntroScreen onOpenMain={onOpenMain} showEntryGuide t={t} />)
    expect(container.querySelectorAll('button, a')).toHaveLength(1)
    click(container.querySelector(`button[aria-label="${t.hiddenAccess}"]`))
    expect(onOpenMain).toHaveBeenCalledOnce()
  })

  it('leaves only the tapping hand of the entry guide when its callout is turned off', () => {
    const onOpenMain = vi.fn()
    render(<IntroScreen onOpenMain={onOpenMain} showEntryGuide entryGuideCallout={false} t={t} />)
    expect(container.querySelector('h2')).toBeNull()
    expect(container.textContent).not.toContain(t.entryGuideTitle)
    expect(container.textContent).not.toContain(t.entryGuideBody)
    expect(container.textContent).toContain('👆')
    expect(container.querySelector('[data-entry-backdrop]')).not.toBeNull()
    click(container.querySelector(`button[aria-label="${t.hiddenAccess}"]`))
    expect(onOpenMain).toHaveBeenCalledOnce()
  })

  it('ignores the callout setting while the entry guide is hidden', () => {
    render(<IntroScreen onOpenMain={() => {}} entryGuideCallout t={t} />)
    expect(container.textContent).not.toContain(t.entryGuideTitle)
    expect(container.textContent).not.toContain('👆')
  })
})

describe('OnboardingWizard', () => {
  const step = (Component, ownsActions = false) => ({ Component, ownsActions })

  it('completes from the finish button', () => {
    const onComplete = vi.fn()
    render(<OnboardingWizard t={t} onComplete={onComplete} steps={[step(() => null)]} />)
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
    const steps = [step(() => <i>one</i>), step(() => <i>two</i>), step(() => <i>three</i>)]
    render(<OnboardingWizard t={t} onComplete={() => {}} steps={steps} />)
    expect(container.textContent).toContain(
      t.onboardingStepCount.replace('{current}', 1).replace('{total}', 3)
    )
  })

  it('advances with the next button and completes only on the last step', () => {
    const onComplete = vi.fn()
    const steps = [step(() => <i>one</i>), step(() => <i>two</i>)]
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
    const steps = [step(({ t: stepT }) => <i>{stepT.onboardingNext}</i>)]
    render(<OnboardingWizard t={t} onComplete={() => {}} steps={steps} />)
    expect(container.querySelector('i').textContent).toBe(t.onboardingNext)
  })

  it('passes the language to the current step', () => {
    const steps = [step(({ language }) => <i>{language}</i>)]
    render(<OnboardingWizard t={t} language="es" onComplete={() => {}} steps={steps} />)
    expect(container.querySelector('i').textContent).toBe('es')
  })

  it('leaves the buttons to a step that owns its actions', () => {
    const onComplete = vi.fn()
    const steps = [
      step(({ onNext }) => <button onClick={onNext}>own</button>, true),
      step(() => <i>two</i>),
    ]
    render(<OnboardingWizard t={t} onComplete={onComplete} steps={steps} />)
    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0].textContent).toBe('own')

    click(buttons[0])
    expect(container.querySelector('i').textContent).toBe('two')
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('completes from the last step when it owns its actions', () => {
    const onComplete = vi.fn()
    const steps = [step(({ onNext }) => <button onClick={onNext}>own</button>, true)]
    render(<OnboardingWizard t={t} onComplete={onComplete} steps={steps} />)
    click(container.querySelector('button'))
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('hands the practice person to the following steps', () => {
    const steps = [
      step(
        ({ onPracticePerson, onNext }) => (
          <button
            onClick={() => {
              onPracticePerson({ name: 'Mia' })
              onNext()
            }}
          >
            own
          </button>
        ),
        true
      ),
      step(({ practicePerson }) => <i>{practicePerson.name}</i>),
    ]
    render(<OnboardingWizard t={t} onComplete={() => {}} steps={steps} />)
    click(container.querySelector('button'))
    expect(container.querySelector('i').textContent).toBe('Mia')
  })

  it('gives the practice person an id and its first event', () => {
    const steps = [
      step(({ onPracticePerson }) => <button onClick={() => onPracticePerson({ name: 'Mia' })} />),
      step(({ practicePerson }) => (
        <i>{practicePerson ? `${typeof practicePerson.id}:${practicePerson.events.length}` : ''}</i>
      )),
    ]
    render(<OnboardingWizard t={t} onComplete={() => {}} steps={steps} />)
    click(container.querySelector('button'))
    click(container.querySelectorAll('button')[1])
    expect(container.querySelector('i').textContent).toBe('string:1')
  })

  it('adds the practice event on top of the practice person events', () => {
    const steps = [
      step(
        ({ onPracticePerson, onPracticeEvent, practicePerson, onNext }) => (
          <>
            <button onClick={() => onPracticePerson({ name: 'Mia' })} />
            <button onClick={() => onPracticeEvent({ place: 'Park' })} />
            <button onClick={onNext} />
            <b>{practicePerson?.events.length}</b>
          </>
        ),
        true
      ),
      step(({ practicePerson }) => (
        <i>{`${practicePerson.events[0].place}:${typeof practicePerson.events[0].id}`}</i>
      )),
    ]
    render(<OnboardingWizard t={t} onComplete={() => {}} steps={steps} />)
    const buttons = container.querySelectorAll('button')
    click(buttons[0])
    click(buttons[1])
    expect(container.querySelector('b').textContent).toBe('2')
    click(buttons[2])
    expect(container.querySelector('i').textContent).toBe('Park:string')
  })

  it('passes the settings to the current step', () => {
    const steps = [step(({ settings }) => <i>{settings.theme}</i>)]
    render(
      <OnboardingWizard t={t} settings={{ theme: 'dark' }} onComplete={() => {}} steps={steps} />
    )
    expect(container.querySelector('i').textContent).toBe('dark')
  })

  it('shows the person step second: the home tour, then the person form', () => {
    const wizardSettings = { theme: 'dark' }
    render(<OnboardingWizard t={t} language="en" settings={wizardSettings} onComplete={() => {}} />)
    click(container.querySelector('button'))
    expect(container.querySelector('[data-tour]')).not.toBeNull()
    expect(container.querySelectorAll('button')).toHaveLength(0)
    expect(tour.props).toMatchObject({ language: 'en', settings: wizardSettings })
    expect(form.props).toBeNull()

    endTour()
    expect(container.querySelector('h1').textContent).toBe(t.onboardingPersonTitle)
    expect(container.querySelectorAll('button')).toHaveLength(0)
    expect(form.props.language).toBe('en')
  })
})

describe('OnboardingPersonStep', () => {
  const settings = { theme: 'dark', iconColor: 'darkPink', statsVisible: false }

  function renderStep() {
    const onPracticePerson = vi.fn()
    const onNext = vi.fn()
    render(
      <OnboardingPersonStep
        t={t}
        language="en"
        settings={settings}
        onPracticePerson={onPracticePerson}
        onNext={onNext}
      />
    )
    return { onPracticePerson, onNext }
  }

  // Leaves the home phase, as the tap on the add-person button does.
  function renderForm() {
    const handlers = renderStep()
    endTour()
    return handlers
  }

  it('starts on the home screen, waiting for a tap on its add-person button', () => {
    const { onPracticePerson, onNext } = renderStep()
    expect(container.querySelector('[data-tour]')).not.toBeNull()
    expect(container.querySelector('h1')).toBeNull()
    expect(form.props).toBeNull()
    expect(tour.props.scenes).toEqual([
      { screen: 'home', note: 'onboardingTourAddNote', guideTarget: 'add' },
    ])
    expect(tour.props).toMatchObject({ t, language: 'en', settings })
    expect(tour.props.person).toBeUndefined()
    expect(onPracticePerson).not.toHaveBeenCalled()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('opens the form when the home tour ends, without moving on', () => {
    const { onNext } = renderForm()
    expect(container.querySelector('[data-tour]')).toBeNull()
    expect(form.props).not.toBeNull()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('starts the form at its top', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    renderStep()
    expect(scrollIntoView).not.toHaveBeenCalled()
    endTour()
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'start' })
    expect(scrollIntoView.mock.contexts[0].contains(container.querySelector('h1'))).toBe(true)
    delete Element.prototype.scrollIntoView
  })

  it('explains the form above it', () => {
    renderForm()
    expect(container.querySelector('h1').textContent).toBe(t.onboardingPersonTitle)
    expect(container.querySelector('p').textContent).toBe(t.onboardingPersonBody)
  })

  it('shows the empty add form with the skip action and the zodiac hint', () => {
    renderForm()
    expect(form.props.initialValues).toBeUndefined()
    expect(form.props.mode).toBe('add')
    expect(form.props.includeHowWeMet).toBe(false)
    expect(form.props.onCancel).toBeUndefined()
    expect(form.props.saveLabel).toBe(t.saveAndBack)
    expect(form.props.skipLabel).toBe(t.onboardingSkip)
    expect(form.props.zodiacHint).toBe(t.onboardingZodiacHint)
  })

  it('keeps the saved person and returns to the intro, which plays by itself', () => {
    const { onPracticePerson, onNext } = renderForm()
    const person = { name: 'Mia' }
    act(() => form.props.onSave(person))
    expect(onPracticePerson).toHaveBeenCalledWith(person)
    expect(onNext).not.toHaveBeenCalled()
    expect(container.querySelector('h1')).toBeNull()
    expect(container.querySelector('[data-tour]')).not.toBeNull()
    expect(tour.props.scenes).toEqual([{ screen: 'intro', auto: true, duration: 2000 }])
    expect(tour.props).toMatchObject({ t, language: 'en' })
  })

  it('moves on when the intro ends', () => {
    const { onNext } = renderForm()
    act(() => form.props.onSave({ name: 'Mia' }))
    endTour()
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('completes what was typed when it is skipped, then returns to the intro', () => {
    const { onPracticePerson, onNext } = renderForm()
    act(() => form.props.onSkip({ name: 'Mia', age: '', gender: 'female' }))
    expect(onPracticePerson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mia',
        gender: 'female',
        activity: 'other',
        birthYear: expect.any(Number),
        zodiacSign: expect.any(String),
      })
    )
    expect(onNext).not.toHaveBeenCalled()
    expect(tour.props.scenes).toEqual([{ screen: 'intro', auto: true, duration: 2000 }])
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
