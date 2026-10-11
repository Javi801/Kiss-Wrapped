import { SCREENS } from '@/lib/constants'
import { ONBOARDING } from '@/lib/config'
import { TOUR_TARGETS } from '@/lib/onboarding'

// Scene lists of the onboarding tours, each in play order. The scene shape is documented
// in `OnboardingTour`, which plays them. `instruction`, `button` and the fields of `hint`
// and `card.hints` are translation keys.
// To add a scene, add an entry here and its texts to every file in `lib/translations/`.

// The home screen, waiting for a tap on its add-person button.
export const ADD_PERSON_SCENES = [
  { screen: SCREENS.main, instruction: 'onboardingTourAddNote', tourTarget: SCREENS.add },
]

// Saving a person returns to the intro, as in the app. The tap on its heart plays by itself.
export const INTRO_SCENES = [
  { screen: SCREENS.intro, auto: true, duration: ONBOARDING.introSceneMs },
]

// From the home screen to the practice person's details: the user taps the people
// button, the person card and then the add-event button. Each scene waits for its tap.
export const PERSON_CARD_SCENES = [
  {
    screen: SCREENS.main,
    instruction: 'onboardingTourHomeNote',
    tourTarget: SCREENS.people,
  },
  {
    screen: SCREENS.people,
    instruction: 'onboardingTourListNote',
    card: { expanded: false, tapTarget: TOUR_TARGETS.card },
  },
  {
    screen: SCREENS.people,
    instruction: 'onboardingTourPersonNote',
    card: {
      expanded: true,
      tapTarget: TOUR_TARGETS.addEvent,
      hints: { edit: 'onboardingEditPersonHint', event: 'onboardingEventHint' },
    },
    // Adding the event is the user's to do: this scene never moves on by itself.
    tapOnly: true,
  },
]

// The person card with the saved event, waiting for a tap on the home item of the bottom bar.
export const SAVED_EVENT_SCENES = [
  {
    screen: SCREENS.people,
    instruction: 'onboardingTourSavedNote',
    card: { expanded: true },
    nav: SCREENS.main,
  },
]

// The two things to know about the home screen: the data backup and the settings.
// The button of the last scene finishes the onboarding.
export const HOME_HINT_SCENES = [
  {
    screen: SCREENS.main,
    tourTarget: TOUR_TARGETS.data,
    hint: { title: 'onboardingDataHintTitle', body: 'onboardingDataHintBody' },
    button: 'onboardingNext',
  },
  {
    screen: SCREENS.main,
    tourTarget: TOUR_TARGETS.settings,
    hint: { title: 'onboardingSettingsHintTitle', body: 'onboardingSettingsHintBody' },
    button: 'onboardingFinish',
  },
]
