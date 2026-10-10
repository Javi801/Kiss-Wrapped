// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY, ZODIAC_OPTIONS } from '@/lib/constants'
import { createPerson } from '@/lib/helpers'

// Only the theme is mocked: the tour runs over the real screens.
vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))

import { TOUR_SCENE_MS } from '@/components/app/OnboardingTour'
import OnboardingTourStep from '@/components/app/OnboardingTourStep'
import OnboardingHomeStep from '@/components/app/OnboardingHomeStep'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en
const settings = { theme: 'pink', iconColor: 'yellow', statsVisible: true }
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

function render(Step) {
  const onNext = vi.fn()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <Step t={t} language="en" practicePerson={person} settings={settings} onNext={onNext} />
    )
  })
  return onNext
}

const wait = (ms) => act(() => vi.advanceTimersByTime(ms))
const buttons = () => [...container.querySelectorAll('button')]
const reachable = (node) => !node.closest('[inert]')
const reachableLabels = () =>
  buttons()
    .filter(reachable)
    .map((button) => button.textContent.replace('👆', ''))
const notes = () => [...container.querySelectorAll('[role="note"]')]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

describe('OnboardingTourStep over the real screens', () => {
  it('leaves nothing reachable on the home and list scenes', () => {
    render(OnboardingTourStep)
    expect(buttons().length).toBeGreaterThan(0)
    expect(reachableLabels()).toEqual([])

    wait(3000)
    expect(container.textContent).toContain(t.personListTitle)
    expect(buttons().length).toBeGreaterThan(0)
    expect(reachableLabels()).toEqual([])
  })

  it('leaves only the add-event button and the hints reachable on the person card', () => {
    const onNext = render(OnboardingTourStep)
    wait(3000)
    wait(TOUR_SCENE_MS)
    expect(reachableLabels()).toEqual([t.addEvent])
    expect(notes().map((note) => note.textContent)).toEqual([
      t.onboardingEditPersonHint,
      t.onboardingEventHint,
    ])
    expect(notes().every(reachable)).toBe(true)

    act(() => buttons().find(reachable).click())
    expect(onNext).toHaveBeenCalledOnce()
  })
})

describe('OnboardingHomeStep over the real screens', () => {
  it('leaves only its own button and the hint reachable on each home scene', () => {
    const onNext = render(OnboardingHomeStep)
    expect(reachableLabels()).toEqual([])

    wait(3000)
    expect(reachableLabels()).toEqual([t.onboardingNext])
    expect(notes()).toHaveLength(1)
    expect(notes().every(reachable)).toBe(true)

    act(() => buttons().find(reachable).click())
    expect(reachableLabels()).toEqual([t.onboardingFinish])
    expect(notes()).toHaveLength(1)
    expect(notes()[0].textContent).toContain(t.onboardingSettingsHintTitle)
    expect(notes().every(reachable)).toBe(true)

    act(() => buttons().find(reachable).click())
    expect(onNext).toHaveBeenCalledOnce()
  })
})
