// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY, ZODIAC_OPTIONS } from '@/lib/constants'
import { createPerson } from '@/lib/helpers'

// Only the theme is mocked: the tour runs over the real screens.
vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))

import OnboardingTour from '@/components/app/onboarding/OnboardingTour'
import { HOME_HINT_SCENES, PERSON_CARD_SCENES } from '@/components/app/onboarding/onboardingScenes'
import { ONBOARDING } from '@/lib/config'
import { SPEECH_BUBBLE_SELECTOR } from '@/lib/onboarding'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en
const settings = { theme: 'pink', iconColor: 'lightPink', statsVisible: true }
const person = createPerson({
  name: 'Mia',
  birthYear: 1995,
  gender: 'female',
  activity: 'works',
  zodiacSign: ZODIAC_OPTIONS.en[0],
  partnerStatus: 'never',
})

let container
let root

function render(scenes) {
  const onDone = vi.fn()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <OnboardingTour
        scenes={scenes}
        person={person}
        t={t}
        language="en"
        settings={settings}
        onDone={onDone}
      />
    )
  })
  return onDone
}

const wait = (ms) => act(() => vi.advanceTimersByTime(ms))
const buttons = () => [...container.querySelectorAll('button')]
const reachable = (node) => !node.closest('[inert]')
const reachableLabels = () =>
  buttons()
    .filter(reachable)
    .map((button) => button.textContent.replace('👆', ''))
const notes = () => [...container.querySelectorAll(SPEECH_BUBBLE_SELECTOR)]
const tapReachable = () => act(() => buttons().find(reachable).click())

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

describe('the person card tour over the real screens', () => {
  it('leaves only the people button reachable on the home scene', () => {
    render(PERSON_CARD_SCENES)
    expect(buttons().length).toBeGreaterThan(1)
    expect(reachableLabels()).toEqual([t.viewEditPeople])
    expect(notes()).toEqual([])
  })

  it('leaves only the person card reachable on the list scene', () => {
    render(PERSON_CARD_SCENES)
    tapReachable()
    expect(container.textContent).toContain(t.personListTitle)
    expect(buttons().length).toBeGreaterThan(1)
    expect(buttons().filter(reachable)).toHaveLength(1)
    expect(reachableLabels()[0]).toContain(person.name)
    expect(notes()).toEqual([])
  })

  it('leaves only the add-event button and the hints reachable on the person card', () => {
    const onDone = render(PERSON_CARD_SCENES)
    tapReachable()
    tapReachable()
    expect(reachableLabels()).toEqual([t.addEvent])
    expect(notes().map((note) => note.textContent)).toEqual([
      t.onboardingEditPersonHint,
      t.onboardingEventHint,
    ])
    expect(notes().every(reachable)).toBe(true)
    expect(onDone).not.toHaveBeenCalled()

    tapReachable()
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('reaches the person card by itself when nothing is tapped, and waits there', () => {
    const onDone = render(PERSON_CARD_SCENES)
    wait(ONBOARDING.tapTimeoutMs)
    expect(container.textContent).toContain(t.personListTitle)
    wait(ONBOARDING.tapTimeoutMs)
    expect(reachableLabels()).toEqual([t.addEvent])

    wait(ONBOARDING.tapTimeoutMs * 10)
    expect(reachableLabels()).toEqual([t.addEvent])
    expect(onDone).not.toHaveBeenCalled()
  })
})

describe('the home hints tour over the real screens', () => {
  it('leaves only its own button and the hint reachable on each home scene', () => {
    const onDone = render(HOME_HINT_SCENES)
    expect(reachableLabels()).toEqual([t.onboardingNext])
    expect(notes()).toHaveLength(1)
    expect(notes()[0].textContent).toContain(t.onboardingDataHintTitle)
    expect(notes().every(reachable)).toBe(true)

    wait(ONBOARDING.tapTimeoutMs * 10)
    expect(reachableLabels()).toEqual([t.onboardingNext])

    tapReachable()
    expect(reachableLabels()).toEqual([t.onboardingFinish])
    expect(notes()).toHaveLength(1)
    expect(notes()[0].textContent).toContain(t.onboardingSettingsHintTitle)
    expect(notes().every(reachable)).toBe(true)
    expect(onDone).not.toHaveBeenCalled()

    tapReachable()
    expect(onDone).toHaveBeenCalledOnce()
  })
})
