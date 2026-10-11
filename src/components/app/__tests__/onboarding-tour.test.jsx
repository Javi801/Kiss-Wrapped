// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY, SCREENS } from '@/lib/constants'
import { ONBOARDING } from '@/lib/config'
import { TOUR_LAYERS, TOUR_TARGETS } from '@/lib/onboarding'

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
        <button onClick={props.cardTour?.onAddEvent}>add event</button>
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

import OnboardingTour from '@/components/app/OnboardingTour'
import OnboardingEventStep from '@/components/app/OnboardingEventStep'
import { HOME_HINT_SCENES, PERSON_CARD_SCENES } from '@/components/app/onboardingScenes'

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

// Plays a scene list as the wizard does for a `{ scenes }` step.
function renderTour(scenes) {
  const onDone = vi.fn()
  render(
    <OnboardingTour
      scenes={scenes}
      person={person}
      t={t}
      language="en"
      settings={settings}
      onDone={onDone}
    />
  )
  return onDone
}

// Label of the mocked screen on display, not a `SCREENS` value.
const screen = () => container.querySelector('[data-screen]').dataset.screen
const status = () => container.querySelector('[role="status"]')
const instruction = () => status().textContent
const wait = (ms = ONBOARDING.sceneMs) => act(() => vi.advanceTimersByTime(ms))
// Taps on the controls the scenes point at, as the screens report them.
const tapHomeButton = (key) => act(() => seen.home.onNavigate(key))
const tapCard = () => act(() => seen.people.cardTour.onToggle())
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

describe('OnboardingTour — person card scenes', () => {
  const renderScenes = () => renderTour(PERSON_CARD_SCENES)

  it('starts on the home screen, pointing at the people button', () => {
    renderScenes()
    expect(screen()).toBe('home')
    expect(instruction()).toBe(t.onboardingTourHomeNote)
    expect(seen.home).toMatchObject({
      people: [person],
      language: 'en',
      tourTarget: SCREENS.people,
      ...settings,
    })
    expect(seen.home.tourHint).toBeUndefined()
  })

  it('moves to the collapsed person card from the people button', () => {
    renderScenes()
    tapHomeButton(SCREENS.people)
    expect(screen()).toBe('people')
    expect(instruction()).toBe(t.onboardingTourListNote)
    expect(seen.people.people).toEqual([person])
    expect(seen.people.cardTour).toMatchObject({
      expanded: false,
      tapTarget: TOUR_TARGETS.card,
      editHint: undefined,
      eventHint: undefined,
    })
  })

  it('moves to the person card by itself when the people button is not tapped', () => {
    renderScenes()
    wait(ONBOARDING.tapTimeoutMs - 1)
    expect(screen()).toBe('home')
    wait(1)
    expect(screen()).toBe('people')
    expect(instruction()).toBe(t.onboardingTourListNote)
  })

  it('expands the card from a tap on it, with its hints', () => {
    renderScenes()
    tapHomeButton(SCREENS.people)
    tapCard()
    expect(instruction()).toBe(t.onboardingTourPersonNote)
    expect(seen.people.cardTour).toMatchObject({
      expanded: true,
      tapTarget: TOUR_TARGETS.addEvent,
      editHint: t.onboardingEditPersonHint,
      eventHint: t.onboardingEventHint,
    })
  })

  it('expands the card by itself when it is not tapped, counting from its own scene', () => {
    renderScenes()
    wait(ONBOARDING.tapTimeoutMs / 2)
    tapHomeButton(SCREENS.people)
    wait(ONBOARDING.tapTimeoutMs - 1)
    expect(instruction()).toBe(t.onboardingTourListNote)
    wait(1)
    expect(instruction()).toBe(t.onboardingTourPersonNote)
  })

  it('waits on the expanded card until the add-event button is tapped', () => {
    const onDone = renderScenes()
    tapHomeButton(SCREENS.people)
    tapCard()
    wait(ONBOARDING.tapTimeoutMs * 10)
    expect(instruction()).toBe(t.onboardingTourPersonNote)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('ends from the add-event button', () => {
    const onDone = renderScenes()
    tapHomeButton(SCREENS.people)
    tapCard()
    act(() => container.querySelector('button').click())
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('shows no bottom bar and no button of its own', () => {
    renderScenes()
    expect(container.querySelector('nav')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
    tapHomeButton(SCREENS.people)
    expect(container.querySelector('nav')).toBeNull()
    expect(container.querySelector('button[type="button"]')).toBeNull()
  })

  it('keeps the screens out of reach of taps', () => {
    renderScenes()
    expect(container.querySelector('[data-screen]').parentElement.style.pointerEvents).toBe('none')
  })

  it('gives the screens handlers that change nothing besides the guided taps', () => {
    renderScenes()
    expect(() => {
      act(() => {
        seen.home.onClearData()
        seen.home.onImportData([])
        seen.home.setTheme('dark')
      })
    }).not.toThrow()
    expect(screen()).toBe('home')
    tapHomeButton(SCREENS.people)
    expect(() => {
      act(() => {
        seen.people.onDeletePerson('mia')
        seen.people.onAddEvent('mia', {})
      })
    }).not.toThrow()
    expect(instruction()).toBe(t.onboardingTourListNote)
  })
})

describe('OnboardingTour', () => {
  it('reports the end of a tour whose last scene is automatic', () => {
    const onDone = vi.fn()
    const scenes = [
      { screen: SCREENS.people, instruction: 'onboardingTourListNote', auto: true },
      { screen: SCREENS.main, instruction: 'onboardingTourHomeNote', auto: true },
    ]
    render(<OnboardingTour scenes={scenes} person={person} t={t} language="en" onDone={onDone} />)
    expect(seen.people.cardTour).toBeUndefined()
    wait()
    expect(screen()).toBe('home')
    expect(seen.home.tourTarget).toBeUndefined()
    expect(onDone).not.toHaveBeenCalled()
    wait()
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('ends quietly when nothing listens for the end', () => {
    const scenes = [{ screen: SCREENS.main, instruction: 'onboardingTourHomeNote', auto: true }]
    render(<OnboardingTour scenes={scenes} person={person} t={t} language="en" />)
    expect(() => wait()).not.toThrow()
    expect(screen()).toBe('home')
  })

  it('keeps an automatic scene for its own duration', () => {
    const onDone = vi.fn()
    const scenes = [{ screen: SCREENS.main, auto: true, duration: ONBOARDING.sceneMs * 2 }]
    render(<OnboardingTour scenes={scenes} person={person} t={t} language="en" onDone={onDone} />)
    wait(ONBOARDING.sceneMs * 2 - 1)
    expect(onDone).not.toHaveBeenCalled()
    wait(1)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('ignores taps on an automatic scene', () => {
    const onDone = vi.fn()
    const scenes = [
      {
        screen: SCREENS.main,
        instruction: 'onboardingTourHomeNote',
        tourTarget: SCREENS.people,
        auto: true,
      },
      { screen: SCREENS.people, instruction: 'onboardingTourListNote', auto: true },
    ]
    render(<OnboardingTour scenes={scenes} person={person} t={t} language="en" onDone={onDone} />)
    tapHomeButton(SCREENS.people)
    expect(screen()).toBe('home')
    expect(onDone).not.toHaveBeenCalled()
  })

  it('moves on only from the button of a scene that has one', () => {
    const onDone = vi.fn()
    const scenes = [{ screen: SCREENS.main, tourTarget: SCREENS.people, button: 'onboardingNext' }]
    render(<OnboardingTour scenes={scenes} person={person} t={t} language="en" onDone={onDone} />)
    tapHomeButton(SCREENS.people)
    wait(ONBOARDING.tapTimeoutMs * 10)
    expect(onDone).not.toHaveBeenCalled()
    act(() => container.querySelector('button').click())
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('reports the end when its last scene is tapped', () => {
    const onDone = vi.fn()
    const scenes = [{ screen: SCREENS.main, tourTarget: SCREENS.add }]
    render(<OnboardingTour scenes={scenes} t={t} language="en" onDone={onDone} />)
    expect(seen.home.tourTarget).toBe(SCREENS.add)
    tapHomeButton(SCREENS.add)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('reports the end when the tap of its last scene never comes', () => {
    const onDone = vi.fn()
    const scenes = [{ screen: SCREENS.main, tourTarget: SCREENS.add }]
    render(<OnboardingTour scenes={scenes} t={t} language="en" onDone={onDone} />)
    wait(ONBOARDING.tapTimeoutMs - 1)
    expect(onDone).not.toHaveBeenCalled()
    wait(1)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('shows the screens empty while there is no practice person', () => {
    const scenes = [{ screen: SCREENS.main, tourTarget: SCREENS.add }, { screen: SCREENS.people }]
    render(<OnboardingTour scenes={scenes} t={t} language="en" />)
    expect(seen.home.people).toEqual([])
    tapHomeButton(SCREENS.add)
    expect(seen.people.people).toEqual([])
  })

  it('shows the intro with only the tap guide on its heart, which does nothing', () => {
    const onDone = vi.fn()
    const scenes = [{ screen: SCREENS.intro, auto: true }]
    render(<OnboardingTour scenes={scenes} t={t} language="en" onDone={onDone} />)
    expect(screen()).toBe('intro')
    expect(status()).toBeNull()
    expect(seen.intro).toMatchObject({ showEntryGuide: true, entryGuideCallout: false, t })
    act(() => seen.intro.onOpenMain())
    expect(screen()).toBe('intro')
    expect(onDone).not.toHaveBeenCalled()
  })

  it('renders no screen for a scene that names one it does not know', () => {
    const onDone = vi.fn()
    const scenes = [
      { screen: SCREENS.stats, instruction: 'onboardingTourHomeNote', button: 'onboardingNext' },
      { screen: 'nowhere', auto: true },
    ]
    render(<OnboardingTour scenes={scenes} person={person} t={t} language="en" onDone={onDone} />)
    expect(container.querySelector('[data-screen]')).toBeNull()
    expect(seen).toMatchObject({ home: null, people: null, intro: null, nav: null })
    // The rest of the scene still plays: its instruction, its button and its end.
    expect(instruction()).toBe(t.onboardingTourHomeNote)
    act(() => container.querySelector('button').click())
    expect(container.querySelector('[data-screen]')).toBeNull()
    wait()
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('shows the bottom bar of the scene screen, pointing at its `nav` item', () => {
    const onDone = vi.fn()
    const scenes = [{ screen: SCREENS.people, nav: SCREENS.main }]
    render(<OnboardingTour scenes={scenes} person={person} t={t} language="en" onDone={onDone} />)
    expect(seen.nav).toMatchObject({ screen: SCREENS.people, tourTarget: SCREENS.main, t })
    tapNav(SCREENS.main)
    expect(onDone).toHaveBeenCalledOnce()
  })
})

describe('OnboardingTour — a new onDone mid-scene', () => {
  const tour = (scenes, onDone) => (
    <OnboardingTour scenes={scenes} person={person} t={t} language="en" onDone={onDone} />
  )
  const rerender = (element) => act(() => root.render(element))

  it('does not restart the timer of the scene', () => {
    const scenes = [{ screen: SCREENS.main, tourTarget: SCREENS.add }]
    const first = vi.fn()
    const latest = vi.fn()
    render(tour(scenes, first))
    wait(ONBOARDING.tapTimeoutMs - 1)
    rerender(tour(scenes, latest))
    expect(latest).not.toHaveBeenCalled()
    wait(1)
    expect(latest).toHaveBeenCalledOnce()
    expect(first).not.toHaveBeenCalled()
  })

  it('does not restart the timer of an automatic scene on every render', () => {
    const scenes = [{ screen: SCREENS.main, auto: true }]
    const onDone = vi.fn()
    render(tour(scenes, () => onDone()))
    // A parent that hands a new function on each render, as the wizard does.
    for (let elapsed = 0; elapsed < ONBOARDING.sceneMs - 1; elapsed += 100) {
      wait(Math.min(100, ONBOARDING.sceneMs - 1 - elapsed))
      rerender(tour(scenes, () => onDone()))
    }
    expect(onDone).not.toHaveBeenCalled()
    wait(1)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('calls the latest one from a tap', () => {
    const scenes = [{ screen: SCREENS.main, tourTarget: SCREENS.add }]
    const first = vi.fn()
    const latest = vi.fn()
    render(tour(scenes, first))
    rerender(tour(scenes, latest))
    tapHomeButton(SCREENS.add)
    expect(latest).toHaveBeenCalledOnce()
    expect(first).not.toHaveBeenCalled()
  })

  it('calls the latest one from the button of the scene', () => {
    const scenes = [{ screen: SCREENS.main, button: 'onboardingFinish' }]
    const first = vi.fn()
    const latest = vi.fn()
    render(tour(scenes, first))
    rerender(tour(scenes, latest))
    act(() => container.querySelector('button').click())
    expect(latest).toHaveBeenCalledOnce()
    expect(first).not.toHaveBeenCalled()
  })

  it('keeps the tour on its scene', () => {
    const first = vi.fn()
    const latest = vi.fn()
    render(tour(PERSON_CARD_SCENES, first))
    tapHomeButton(SCREENS.people)
    rerender(tour(PERSON_CARD_SCENES, latest))
    expect(instruction()).toBe(t.onboardingTourListNote)
  })
})

describe('OnboardingTour — home hint scenes', () => {
  const stepButton = () => container.querySelector('button[type="button"]')
  const renderScenes = () => renderTour(HOME_HINT_SCENES)

  it('starts on the home screen with the data hint and a next button', () => {
    renderScenes()
    expect(screen()).toBe('home')
    expect(container.querySelector('nav')).toBeNull()
    expect(status()).toBeNull()
    expect(seen.home).toMatchObject({
      people: [person],
      tourTarget: TOUR_TARGETS.data,
      tourHint: { title: t.onboardingDataHintTitle, body: t.onboardingDataHintBody },
      ...settings,
    })
    expect(stepButton().textContent).toBe(t.onboardingNext)
  })

  it('stays on the data hint until its button is tapped', () => {
    const onDone = renderScenes()
    tapHomeButton(SCREENS.people)
    wait(ONBOARDING.tapTimeoutMs * 10)
    expect(seen.home.tourTarget).toBe(TOUR_TARGETS.data)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('dims everything behind the hints, keeping the button on top', () => {
    renderScenes()
    const backdrop = container.querySelector('[data-tour-backdrop]')
    expect(backdrop.style.pointerEvents).toBe('none')
    expect(backdrop.style.position).toBe('fixed')
    expect(backdrop.style.zIndex).toBe(String(TOUR_LAYERS.backdrop))
    expect(stepButton().parentElement.style.zIndex).toBe(String(TOUR_LAYERS.button))
    expect(TOUR_LAYERS.button).toBeGreaterThan(TOUR_LAYERS.backdrop)
    act(() => stepButton().click())
    expect(container.querySelector('[data-tour-backdrop]')).not.toBeNull()
  })

  it('shows the settings hint last and finishes from its button', () => {
    const onDone = renderScenes()
    act(() => stepButton().click())
    expect(onDone).not.toHaveBeenCalled()
    expect(seen.home).toMatchObject({
      tourTarget: TOUR_TARGETS.settings,
      tourHint: { title: t.onboardingSettingsHintTitle, body: t.onboardingSettingsHintBody },
    })
    expect(stepButton().textContent).toBe(t.onboardingFinish)
    act(() => stepButton().click())
    expect(onDone).toHaveBeenCalledOnce()
  })
})

describe('OnboardingTour — backdrop', () => {
  it('leaves a scene without a hint undimmed', () => {
    renderTour(PERSON_CARD_SCENES)
    expect(container.querySelector('[data-tour-backdrop]')).toBeNull()
  })
})

describe('OnboardingTour — scrolling', () => {
  it('brings the top of a scene without bubbles into view', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const scenes = [{ screen: SCREENS.main, instruction: 'onboardingTourHomeNote', auto: true }]
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
    expect(instruction()).toBe(t.onboardingTourSavedNote)
    expect(seen.people).toMatchObject({ people: [person], language: 'en' })
    expect(seen.people.cardTour).toMatchObject({ expanded: true, tapTarget: undefined })
    expect(seen.nav).toMatchObject({ screen: SCREENS.people, tourTarget: SCREENS.main })
  })

  it('moves on from the home item of the bottom bar', () => {
    const { onNext } = renderStep()
    act(() => seen.eventForm.onSave({ place: 'Park' }))
    tapNav(SCREENS.main)
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('moves on by itself when the home item is not tapped', () => {
    const { onNext } = renderStep()
    act(() => seen.eventForm.onSave({ place: 'Park' }))
    wait(ONBOARDING.tapTimeoutMs - 1)
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
