import { describe, it, expect } from 'vitest'
import * as sceneLists from '@/components/app/onboarding/onboardingScenes'
import { COPY, SCREENS } from '@/lib/constants'
import { TOUR_TARGETS } from '@/lib/onboarding'

// What `OnboardingTour` and the screens it renders accept, per kind of target.
const TOUR_SCREENS = [SCREENS.intro, SCREENS.main, SCREENS.people]
// Buttons of the home screen that take the tap of a scene.
const HOME_TAP_TARGETS = [SCREENS.add, SCREENS.people]
// Controls of the home screen a scene points at with a hint.
const HOME_HINT_TARGETS = [TOUR_TARGETS.data, TOUR_TARGETS.settings]
const CARD_TAP_TARGETS = [TOUR_TARGETS.card, TOUR_TARGETS.addEvent]
// Items of the bottom bar.
const NAV_TARGETS = [SCREENS.main, SCREENS.add, SCREENS.people, SCREENS.stats]

const SCENE_FIELDS = [
  'screen',
  'instruction',
  'auto',
  'duration',
  'button',
  'tourTarget',
  'hint',
  'card',
  'nav',
  'tapOnly',
]

const lists = Object.entries(sceneLists)
// Every scene with a label that tells where a failed check comes from.
const scenes = lists.flatMap(([name, list]) =>
  list.map((scene, index) => ({ scene, label: `${name}[${index}]` }))
)

// Translation keys a scene names, each with the field it comes from.
function translationKeys(scene) {
  return [
    ['instruction', scene.instruction],
    ['button', scene.button],
    ['hint.title', scene.hint?.title],
    ['hint.body', scene.hint?.body],
    ['card.hints.edit', scene.card?.hints?.edit],
    ['card.hints.event', scene.card?.hints?.event],
  ].filter(([, key]) => key !== undefined)
}

// Whether the scene points at a control that takes its tap, on the screen that renders it.
function pointsAtSomethingTappable(scene) {
  const homeButton = scene.screen === SCREENS.main && HOME_TAP_TARGETS.includes(scene.tourTarget)
  const cardControl =
    scene.screen === SCREENS.people && CARD_TAP_TARGETS.includes(scene.card?.tapTarget)
  return homeButton || cardControl || NAV_TARGETS.includes(scene.nav)
}

describe('onboarding scene lists', () => {
  it('exports only non-empty lists of scenes', () => {
    expect(lists.length).toBeGreaterThan(0)
    for (const [name, list] of lists) {
      expect(Array.isArray(list), name).toBe(true)
      expect(list.length, name).toBeGreaterThan(0)
    }
  })

  it('uses only the fields the tour reads', () => {
    for (const { scene, label } of scenes) {
      for (const field of Object.keys(scene)) expect(SCENE_FIELDS, label).toContain(field)
      for (const field of Object.keys(scene.card ?? {})) {
        expect(['expanded', 'tapTarget', 'hints'], label).toContain(field)
      }
    }
  })

  it('names only screens the tour can render', () => {
    for (const { scene, label } of scenes) expect(TOUR_SCREENS, label).toContain(scene.screen)
  })

  it('points the home screen only at its own controls', () => {
    for (const { scene, label } of scenes) {
      if (scene.tourTarget === undefined) continue
      expect(scene.screen, label).toBe(SCREENS.main)
      expect([...HOME_TAP_TARGETS, ...HOME_HINT_TARGETS], label).toContain(scene.tourTarget)
    }
  })

  it('gives a hint only to the home controls that show one, with a title and a body', () => {
    for (const { scene, label } of scenes) {
      if (scene.hint === undefined) continue
      expect(HOME_HINT_TARGETS, label).toContain(scene.tourTarget)
      expect(Object.keys(scene.hint).sort(), label).toEqual(['body', 'title'])
    }
  })

  it('guides the person card only on the people screen, tapping one of its controls', () => {
    for (const { scene, label } of scenes) {
      if (scene.card === undefined) continue
      expect(scene.screen, label).toBe(SCREENS.people)
      expect(typeof scene.card.expanded, label).toBe('boolean')
      if (scene.card.tapTarget !== undefined) {
        expect(CARD_TAP_TARGETS, label).toContain(scene.card.tapTarget)
      }
      if (scene.card.hints !== undefined) {
        expect(Object.keys(scene.card.hints).sort(), label).toEqual(['edit', 'event'])
      }
    }
  })

  it('points the bottom bar only at one of its items', () => {
    for (const { scene, label } of scenes) {
      if (scene.nav !== undefined) expect(NAV_TARGETS, label).toContain(scene.nav)
    }
  })

  it('names only texts that exist in every language', () => {
    for (const { scene, label } of scenes) {
      for (const [field, key] of translationKeys(scene)) {
        for (const [language, copy] of Object.entries(COPY)) {
          const where = `${label}.${field} "${key}" in ${language}`
          expect(typeof copy[key], where).toBe('string')
          expect(copy[key].trim(), where).not.toBe('')
        }
      }
    }
  })

  it('points every scene that waits for a tap at something tappable', () => {
    for (const { scene, label } of scenes) {
      if (scene.auto || scene.button) continue
      expect(pointsAtSomethingTappable(scene), label).toBe(true)
    }
  })

  it('sets a duration only on automatic scenes, as a positive number', () => {
    for (const { scene, label } of scenes) {
      if (scene.duration === undefined) continue
      expect(scene.auto, label).toBe(true)
      expect(scene.duration, label).toBeGreaterThan(0)
    }
  })
})
