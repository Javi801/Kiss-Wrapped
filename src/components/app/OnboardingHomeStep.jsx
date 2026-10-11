import OnboardingTour from '@/components/app/OnboardingTour'

// The two things to know about the home screen.
const HOME_SCENES = [
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
 * Last onboarding step: the home screen, where the tour points out the data
 * backup and the settings. Its last button finishes the tutorial.
 *
 * Props:
 *  - t               Active translation dictionary
 *  - language        Active language
 *  - practicePerson  Practice person, with its event
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
