import OnboardingTour from '@/components/app/OnboardingTour'

// From the home screen to the practice person's details, where the tour waits.
const TOUR_SCENES = [
  // The first scene stays longer: the home screen is new and has more to take in.
  {
    screen: 'home',
    note: 'onboardingTourHomeNote',
    guideTarget: 'people',
    auto: true,
    duration: 3000,
  },
  {
    screen: 'people',
    note: 'onboardingTourListNote',
    card: { expanded: false, tapTarget: 'card' },
    auto: true,
  },
  {
    screen: 'people',
    note: 'onboardingTourPersonNote',
    card: { expanded: true, tapTarget: 'addEvent', hints: true },
  },
]

/**
 * Third onboarding step: an automatic tour from the home screen to the practice
 * person's details. It stops there and moves on from the add-event button.
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
      onAddEvent={onNext}
    />
  )
}
