// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

const seen = vi.hoisted(() => ({ home: null, people: null, eventForm: null, nav: null }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/app/HomeScreen', () => ({
  default: (props) => {
    seen.home = props
    return <section data-screen="home" />
  },
}))
vi.mock('@/components/people/PeopleManagerScreen', () => ({
  default: (props) => {
    seen.people = props
    return (
      <section data-screen="people">
        <button onClick={props.cardGuide?.onAddEvent}>add event</button>
      </section>
    )
  },
}))
vi.mock('@/components/app/BottomNav', () => ({
  default: (props) => {
    seen.nav = props
    return <nav />
  },
}))
vi.mock('@/components/forms/EventForm', () => ({
  default: (props) => {
    seen.eventForm = props
    return null
  },
}))

import OnboardingTour, { TOUR_SCENE_MS } from '@/components/app/OnboardingTour'
import OnboardingTourStep from '@/components/app/OnboardingTourStep'
import OnboardingEventStep from '@/components/app/OnboardingEventStep'
import OnboardingHomeStep from '@/components/app/OnboardingHomeStep'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en
const person = { id: 'mia', name: 'Mia', events: [] }
const settings = {
  theme: 'dark',
  iconColor: 'pink',
  statsVisible: false,
  includePartnerEvents: true,
}

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

const screen = () => container.querySelector('[data-screen]').dataset.screen
const note = () => container.querySelector('[role="status"]').textContent
const wait = (ms = TOUR_SCENE_MS) => act(() => vi.advanceTimersByTime(ms))

beforeEach(() => {
  vi.useFakeTimers()
  seen.home = null
  seen.people = null
  seen.eventForm = null
  seen.nav = null
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

describe('OnboardingTourStep', () => {
  function renderStep() {
    const onNext = vi.fn()
    render(
      <OnboardingTourStep
        t={t}
        language="en"
        practicePerson={person}
        settings={settings}
        onNext={onNext}
      />
    )
    return onNext
  }

  it('starts on the home screen, pointing at the people button', () => {
    renderStep()
    expect(screen()).toBe('home')
    expect(note()).toBe(t.onboardingTourHomeNote)
    expect(seen.home).toMatchObject({
      people: [person],
      language: 'en',
      guideTarget: 'people',
      ...settings,
    })
  })

  it('moves to the collapsed person card by itself', () => {
    renderStep()
    wait(TOUR_SCENE_MS - 1)
    expect(screen()).toBe('home')
    wait(1)
    expect(screen()).toBe('people')
    expect(note()).toBe(t.onboardingTourListNote)
    expect(seen.people.people).toEqual([person])
    expect(seen.people.cardGuide).toMatchObject({
      expanded: false,
      tapTarget: 'card',
      editHint: undefined,
      eventHint: undefined,
    })
  })

  it('then expands the card with its hints and waits there', () => {
    const onNext = renderStep()
    wait()
    wait()
    expect(note()).toBe(t.onboardingTourPersonNote)
    expect(seen.people.cardGuide).toMatchObject({
      expanded: true,
      tapTarget: 'addEvent',
      editHint: t.onboardingEditPersonHint,
      eventHint: t.onboardingEventHint,
    })
    wait(TOUR_SCENE_MS * 10)
    expect(note()).toBe(t.onboardingTourPersonNote)
    expect(onNext).not.toHaveBeenCalled()
  })

  it('moves on from the add-event button', () => {
    const onNext = renderStep()
    wait()
    wait()
    act(() => container.querySelector('button').click())
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('keeps the screens out of reach of taps', () => {
    renderStep()
    expect(container.querySelector('[data-screen]').parentElement.style.pointerEvents).toBe('none')
  })

  it('gives the screens handlers that change nothing', () => {
    renderStep()
    expect(() => {
      seen.home.onNavigate('people')
      seen.home.onClearData()
      seen.home.setTheme('dark')
    }).not.toThrow()
    wait()
    expect(() => {
      seen.people.onDeletePerson('mia')
      seen.people.onAddEvent('mia', {})
    }).not.toThrow()
    expect(screen()).toBe('people')
  })
})

describe('OnboardingTour', () => {
  it('reports the end of a tour whose last scene is automatic', () => {
    const onDone = vi.fn()
    const scenes = [
      { screen: 'people', note: 'onboardingTourListNote', auto: true },
      { screen: 'home', note: 'onboardingTourHomeNote', auto: true },
    ]
    render(<OnboardingTour scenes={scenes} person={person} t={t} language="en" onDone={onDone} />)
    expect(seen.people.cardGuide).toBeUndefined()
    wait()
    expect(screen()).toBe('home')
    expect(seen.home.guideTarget).toBeUndefined()
    expect(onDone).not.toHaveBeenCalled()
    wait()
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('ends quietly when nothing listens for the end', () => {
    const scenes = [{ screen: 'home', note: 'onboardingTourHomeNote', auto: true }]
    render(<OnboardingTour scenes={scenes} person={person} t={t} language="en" />)
    expect(() => wait()).not.toThrow()
    expect(screen()).toBe('home')
  })
})

describe('OnboardingHomeStep', () => {
  const stepButton = () => container.querySelector('button[type="button"]')

  function renderStep() {
    const onNext = vi.fn()
    render(
      <OnboardingHomeStep
        t={t}
        language="en"
        practicePerson={person}
        settings={settings}
        onNext={onNext}
      />
    )
    return onNext
  }

  it('starts on the expanded person card, pointing at home in the bottom bar', () => {
    renderStep()
    expect(screen()).toBe('people')
    expect(note()).toBe(t.onboardingTourSavedNote)
    expect(seen.people.cardGuide).toMatchObject({ expanded: true, tapTarget: undefined })
    expect(seen.nav).toMatchObject({ screen: 'people', guideTarget: 'main' })
    expect(() => seen.nav.onNavigate('main')).not.toThrow()
    expect(stepButton()).toBeNull()
  })

  it('goes back home by itself and shows the data hint with a next button', () => {
    renderStep()
    wait()
    expect(screen()).toBe('home')
    expect(container.querySelector('nav')).toBeNull()
    expect(container.querySelector('[role="status"]')).toBeNull()
    expect(seen.home).toMatchObject({
      guideTarget: 'data',
      guideHint: { title: t.onboardingDataHintTitle, body: t.onboardingDataHintBody },
      ...settings,
    })
    expect(stepButton().textContent).toBe(t.onboardingNext)
    wait(TOUR_SCENE_MS * 10)
    expect(seen.home.guideTarget).toBe('data')
  })

  it('shows the settings hint last and finishes from its button', () => {
    const onNext = renderStep()
    wait()
    act(() => stepButton().click())
    expect(onNext).not.toHaveBeenCalled()
    expect(seen.home).toMatchObject({
      guideTarget: 'settings',
      guideHint: { title: t.onboardingSettingsHintTitle, body: t.onboardingSettingsHintBody },
    })
    expect(stepButton().textContent).toBe(t.onboardingFinish)
    act(() => stepButton().click())
    expect(onNext).toHaveBeenCalledOnce()
  })
})

describe('OnboardingTour — scrolling', () => {
  it('brings the top of a scene without bubbles into view', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const scenes = [{ screen: 'home', note: 'onboardingTourHomeNote', auto: true }]
    render(<OnboardingTour scenes={scenes} person={person} t={t} language="en" />)
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' })
    delete Element.prototype.scrollIntoView
  })
})

describe('OnboardingEventStep', () => {
  function renderStep() {
    const onPracticeEvent = vi.fn()
    const onNext = vi.fn()
    render(<OnboardingEventStep t={t} onPracticeEvent={onPracticeEvent} onNext={onNext} />)
    return { onPracticeEvent, onNext }
  }

  it('explains the form above it', () => {
    renderStep()
    expect(container.querySelector('h1').textContent).toBe(t.onboardingEventTitle)
    expect(container.querySelector('p').textContent).toBe(t.onboardingEventBody)
  })

  it('shows the empty event form with the skip action and the tags hint', () => {
    renderStep()
    expect(seen.eventForm.initialValues).toBeUndefined()
    expect(seen.eventForm.onCancel).toBeUndefined()
    expect(seen.eventForm.onDelete).toBeUndefined()
    expect(seen.eventForm.skipLabel).toBe(t.onboardingSkip)
    expect(seen.eventForm.tagsHint).toBe(t.onboardingTagsHint)
    expect(seen.eventForm.placeTags).toEqual([])
    expect(seen.eventForm.situationTags).toEqual([])
  })

  it('keeps the tags added while practicing', () => {
    renderStep()
    act(() => seen.eventForm.onAddPlaceTag('Park'))
    act(() => seen.eventForm.onAddSituationTag('Date'))
    expect(seen.eventForm.placeTags).toEqual(['Park'])
    expect(seen.eventForm.situationTags).toEqual(['Date'])
  })

  it('keeps the saved event and moves on', () => {
    const { onPracticeEvent, onNext } = renderStep()
    const event = { place: 'Park' }
    act(() => seen.eventForm.onSave(event))
    expect(onPracticeEvent).toHaveBeenCalledWith(event)
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('completes what was typed when it is skipped', () => {
    const { onPracticeEvent, onNext } = renderStep()
    act(() => seen.eventForm.onSkip({ place: 'Park', situation: '', score: 'none' }))
    expect(onPracticeEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        place: 'Park',
        situation: t.onboardingPracticeSituation,
        score: null,
        date: expect.any(String),
      })
    )
    expect(onNext).toHaveBeenCalledOnce()
  })
})
