import OnboardingTour from '@/components/app/OnboardingTour'

// Back to the home screen through the bottom bar, then the two things to know about it.
const HOME_SCENES = [
  {
    screen: 'people',
    note: 'onboardingTourSavedNote',
    card: { expanded: true },
    nav: 'main',
    auto: true,
    // Long enough to see the saved event and the tap on the bottom bar.
    duration: 3000,
  },
  {
    screen: 'home',
    guideTarget: 'data',
    hint: { title: 'onboardingDataHintTitle', body: 'onboardingDataHintBody' },
    button: 'onboardingNext',
  },
  {
    screen: 'home',
    guideTarget: 'settings',
    hint: { title: 'onboardingSettingsHintTitle', body: 'onboardingSettingsHintBody' },
    button: 'onboardingFinish',
  },
]

/**
 * Last onboarding step: returns to the home screen and points out the data
 * backup and the settings. Its last button finishes the tutorial.
 *
 * Props:
 *  - t               Active translation dictionary
 *  - language        Active language
 *  - practicePerson  Practice person, with the event of the previous step
 *  - settings        Settings the home screen shows
 *  - onNext          Finishes the step
 */
export default function OnboardingHomeStep({ t, language, practicePerson, settings, onNext }) {
  return (
    <OnboardingTour
      scenes={HOME_SCENES}
      person={practicePerson}
      t={t}
      language={language}
      settings={settings}
      onDone={onNext}
    />
  )
}
