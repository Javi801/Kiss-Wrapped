import OnboardingTour from '@/components/app/OnboardingTour'

// From the home screen to the practice person's details. Each scene waits for its tap.
const TOUR_SCENES = [
  {
    screen: 'home',
    note: 'onboardingTourHomeNote',
    guideTarget: 'people',
  },
  {
    screen: 'people',
    note: 'onboardingTourListNote',
    card: { expanded: false, tapTarget: 'card' },
  },
  {
    screen: 'people',
    note: 'onboardingTourPersonNote',
    card: { expanded: true, tapTarget: 'addEvent', hints: true },
    // Adding the event is the user's to do: this scene never moves on by itself.
    tapOnly: true,
  },
]

/**
 * Third onboarding step: a guided tour from the home screen to the practice
 * person's details. The user taps the people button, the person card and then
 * the add-event button, which moves on.
 *
 * Props:
 *  - t               Active translation dictionary
 *  - language        Active language
 *  - practicePerson  Person created in the previous step
 *  - settings        Settings the home screen shows
 *  - onNext          Moves to the next step
 */
export default function OnboardingTourStep({ t, language, practicePerson, settings, onNext }) {
  return (
    <OnboardingTour
      scenes={TOUR_SCENES}
      person={practicePerson}
      t={t}
      language={language}
      settings={settings}
      onDone={onNext}
    />
  )
}
