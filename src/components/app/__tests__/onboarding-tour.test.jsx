// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

const seen = vi.hoisted(() => ({
  home: null,
  people: null,
  intro: null,
  eventForm: null,
  nav: null,
}))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/app/HomeScreen', () => ({
  default: (props) => {
    seen.home = props
    return <section data-screen="home" />
  },
}))
vi.mock('@/components/app/IntroScreen', () => ({
  default: (props) => {
    seen.intro = props
    return <section data-screen="intro" />
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

import OnboardingTour, { TOUR_SCENE_MS, TOUR_TAP_MS } from '@/components/app/OnboardingTour'
import OnboardingTourStep from '@/components/app/OnboardingTourStep'
import OnboardingEventStep from '@/components/app/OnboardingEventStep'
import OnboardingHomeStep from '@/components/app/OnboardingHomeStep'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en
const person = { id: 'mia', name: 'Mia', events: [] }
const settings = {
  theme: 'dark',
  iconColor: 'darkPink',
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
const status = () => container.querySelector('[role="status"]')
const note = () => status().textContent
const wait = (ms = TOUR_SCENE_MS) => act(() => vi.advanceTimersByTime(ms))
// Taps on the controls the scenes point at, as the screens report them.
const tapHomeButton = (key) => act(() => seen.home.onNavigate(key))
const tapCard = () => act(() => seen.people.cardGuide.onToggle())
const tapNav = (key) => act(() => seen.nav.onNavigate(key))

beforeEach(() => {
  vi.useFakeTimers()
  seen.home = null
  seen.people = null
  seen.intro = null
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

  it('moves to the collapsed person card from the people button', () => {
    renderStep()
    tapHomeButton('people')
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

  it('moves to the person card by itself when the people button is not tapped', () => {
    renderStep()
    wait(TOUR_TAP_MS - 1)
    expect(screen()).toBe('home')
    wait(1)
    expect(screen()).toBe('people')
    expect(note()).toBe(t.onboardingTourListNote)
  })

  it('expands the card from a tap on it, with its hints', () => {
    renderStep()
    tapHomeButton('people')
    tapCard()
    expect(note()).toBe(t.onboardingTourPersonNote)
    expect(seen.people.cardGuide).toMatchObject({
      expanded: true,
      tapTarget: 'addEvent',
      editHint: t.onboardingEditPersonHint,
      eventHint: t.onboardingEventHint,
    })
  })

  it('expands the card by itself when it is not tapped, counting from its own scene', () => {
    renderStep()
    wait(TOUR_TAP_MS / 2)
    tapHomeButton('people')
    wait(TOUR_TAP_MS - 1)
    expect(note()).toBe(t.onboardingTourListNote)
    wait(1)
    expect(note()).toBe(t.onboardingTourPersonNote)
  })

  it('waits on the expanded card until the add-event button is tapped', () => {
    const onNext = renderStep()
    tapHomeButton('people')
    tapCard()
    wait(TOUR_TAP_MS * 10)
    expect(note()).toBe(t.onboardingTourPersonNote)
    expect(onNext).not.toHaveBeenCalled()
  })

  it('moves on from the add-event button', () => {
    const onNext = renderStep()
    tapHomeButton('people')
    tapCard()
    act(() => container.querySelector('button').click())
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('keeps the screens out of reach of taps', () => {
    renderStep()
    expect(container.querySelector('[data-screen]').parentElement.style.pointerEvents).toBe('none')
  })

  it('gives the screens handlers that change nothing besides the guided taps', () => {
    renderStep()
    expect(() => {
      act(() => {
        seen.home.onClearData()
        seen.home.onImportData([])
        seen.home.setTheme('dark')
      })
    }).not.toThrow()
    expect(screen()).toBe('home')
    tapHomeButton('people')
    expect(() => {
      act(() => {
        seen.people.onDeletePerson('mia')
        seen.people.onAddEvent('mia', {})
      })
    }).not.toThrow()
    expect(note()).toBe(t.onboardingTourListNote)
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

  it('keeps an automatic scene for its own duration', () => {
    const onDone = vi.fn()
    const scenes = [{ screen: 'home', auto: true, duration: TOUR_SCENE_MS * 2 }]
    render(<OnboardingTour scenes={scenes} person={person} t={t} language="en" onDone={onDone} />)
    wait(TOUR_SCENE_MS * 2 - 1)
    expect(onDone).not.toHaveBeenCalled()
    wait(1)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('ignores taps on an automatic scene', () => {
    const onDone = vi.fn()
    const scenes = [
      { screen: 'home', note: 'onboardingTourHomeNote', guideTarget: 'people', auto: true },
      { screen: 'people', note: 'onboardingTourListNote', auto: true },
    ]
    render(<OnboardingTour scenes={scenes} person={person} t={t} language="en" onDone={onDone} />)
    tapHomeButton('people')
    expect(screen()).toBe('home')
    expect(onDone).not.toHaveBeenCalled()
  })

  it('moves on only from the button of a scene that has one', () => {
    const onDone = vi.fn()
    const scenes = [{ screen: 'home', guideTarget: 'people', button: 'onboardingNext' }]
    render(<OnboardingTour scenes={scenes} person={person} t={t} language="en" onDone={onDone} />)
    tapHomeButton('people')
    wait(TOUR_TAP_MS * 10)
    expect(onDone).not.toHaveBeenCalled()
    act(() => container.querySelector('button').click())
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('reports the end when its last scene is tapped', () => {
    const onDone = vi.fn()
    const scenes = [{ screen: 'home', guideTarget: 'add' }]
    render(<OnboardingTour scenes={scenes} t={t} language="en" onDone={onDone} />)
    expect(seen.home.guideTarget).toBe('add')
    tapHomeButton('add')
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('reports the end when the tap of its last scene never comes', () => {
    const onDone = vi.fn()
    const scenes = [{ screen: 'home', guideTarget: 'add' }]
    render(<OnboardingTour scenes={scenes} t={t} language="en" onDone={onDone} />)
    wait(TOUR_TAP_MS - 1)
    expect(onDone).not.toHaveBeenCalled()
    wait(1)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('shows the screens empty while there is no practice person', () => {
    const scenes = [{ screen: 'home', guideTarget: 'add' }, { screen: 'people' }]
    render(<OnboardingTour scenes={scenes} t={t} language="en" />)
    expect(seen.home.people).toEqual([])
    tapHomeButton('add')
    expect(seen.people.people).toEqual([])
  })

  it('shows the intro with only the tap guide on its heart, which does nothing', () => {
    const onDone = vi.fn()
    const scenes = [{ screen: 'intro', auto: true }]
    render(<OnboardingTour scenes={scenes} t={t} language="en" onDone={onDone} />)
    expect(screen()).toBe('intro')
    expect(status()).toBeNull()
    expect(seen.intro).toMatchObject({ showEntryGuide: true, entryGuideCallout: false, t })
    act(() => seen.intro.onOpenMain())
    expect(screen()).toBe('intro')
    expect(onDone).not.toHaveBeenCalled()
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

  it('starts on the home screen with the data hint and a next button', () => {
    renderStep()
    expect(screen()).toBe('home')
    expect(container.querySelector('nav')).toBeNull()
    expect(status()).toBeNull()
    expect(seen.home).toMatchObject({
      people: [person],
      guideTarget: 'data',
      guideHint: { title: t.onboardingDataHintTitle, body: t.onboardingDataHintBody },
      ...settings,
    })
    expect(stepButton().textContent).toBe(t.onboardingNext)
  })

  it('stays on the data hint until its button is tapped', () => {
    const onNext = renderStep()
    tapHomeButton('people')
    wait(TOUR_TAP_MS * 10)
    expect(seen.home.guideTarget).toBe('data')
    expect(onNext).not.toHaveBeenCalled()
  })

  it('dims everything behind the hints, keeping the button on top', () => {
    renderStep()
    const backdrop = container.querySelector('[data-tour-backdrop]')
    expect(backdrop.style.pointerEvents).toBe('none')
    expect(backdrop.style.position).toBe('fixed')
    expect(Number(stepButton().parentElement.style.zIndex)).toBeGreaterThan(
      Number(backdrop.style.zIndex)
    )
    act(() => stepButton().click())
    expect(container.querySelector('[data-tour-backdrop]')).not.toBeNull()
  })

  it('shows the settings hint last and finishes from its button', () => {
    const onNext = renderStep()
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
    render(
      <OnboardingEventStep
        t={t}
        language="en"
        practicePerson={person}
        settings={settings}
        onPracticeEvent={onPracticeEvent}
        onNext={onNext}
      />
    )
    return { onPracticeEvent, onNext }
  }

  it('explains the form above it', () => {
    renderStep()
    expect(container.querySelector('h1').textContent).toBe(t.onboardingEventTitle)
    expect(container.querySelector('p').textContent).toBe(t.onboardingEventBody)
    expect(container.querySelector('[data-screen]')).toBeNull()
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

  it('keeps the saved event and shows it on the person card, pointing at home', () => {
    const { onPracticeEvent, onNext } = renderStep()
    const event = { place: 'Park' }
    act(() => seen.eventForm.onSave(event))
    expect(onPracticeEvent).toHaveBeenCalledWith(event)
    expect(onNext).not.toHaveBeenCalled()
    expect(container.querySelector('h1')).toBeNull()
    expect(screen()).toBe('people')
    expect(note()).toBe(t.onboardingTourSavedNote)
    expect(seen.people).toMatchObject({ people: [person], language: 'en' })
    expect(seen.people.cardGuide).toMatchObject({ expanded: true, tapTarget: undefined })
    expect(seen.nav).toMatchObject({ screen: 'people', guideTarget: 'main' })
  })

  it('moves on from the home item of the bottom bar', () => {
    const { onNext } = renderStep()
    act(() => seen.eventForm.onSave({ place: 'Park' }))
    tapNav('main')
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('moves on by itself when the home item is not tapped', () => {
    const { onNext } = renderStep()
    act(() => seen.eventForm.onSave({ place: 'Park' }))
    wait(TOUR_TAP_MS - 1)
    expect(onNext).not.toHaveBeenCalled()
    wait(1)
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('completes what was typed when it is skipped, then shows the person card', () => {
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
    expect(onNext).not.toHaveBeenCalled()
    expect(screen()).toBe('people')
  })
})
