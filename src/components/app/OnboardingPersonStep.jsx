import { useEffect, useRef, useState } from 'react'

import PersonForm from '@/components/forms/PersonForm'
import FormCard from '@/components/app/FormCard'
import OnboardingFormStep from '@/components/app/OnboardingFormStep'
import OnboardingTour from '@/components/app/OnboardingTour'
import { completePracticePerson } from '@/lib/onboarding'
import { ADD_PERSON_SCENES, INTRO_SCENES } from '@/components/app/onboardingScenes'

// Phases of the step, in order: the tour before the form, the form, the tour after it.
const PHASES = { tourBefore: 'tourBefore', form: 'form', tourAfter: 'tourAfter' }

/**
 * Onboarding step for the practice person, in three phases: the home screen, where the user taps
 * the add-person button; the person form as the date sees it, empty; and the
 * intro, which the tour leaves by itself.
 * Saving or skipping hands the practice person to the wizard and shows the intro;
 * skipping keeps what was typed and fills the rest.
 *
 * Props:
 *  - t                 Active translation dictionary
 *  - language          Active language, for the zodiac options
 *  - settings          Settings the home screen shows
 *  - onPracticePerson  Receives the practice person
 *  - onNext            Moves to the next step
 */
export default function OnboardingPersonStep({ t, language, settings, onPracticePerson, onNext }) {
  const [phase, setPhase] = useState(PHASES.tourBefore)
  const formRef = useRef(null)

  // The form replaces the home screen in the same scroll container: start it at its top.
  useEffect(() => {
    if (phase === PHASES.form) formRef.current?.scrollIntoView?.({ block: 'start' })
  }, [phase])

  function finish(person) {
    onPracticePerson(person)
    setPhase(PHASES.tourAfter)
  }

  if (phase === PHASES.tourBefore) {
    return (
      <OnboardingTour
        scenes={ADD_PERSON_SCENES}
        t={t}
        language={language}
        settings={settings}
        onDone={() => setPhase(PHASES.form)}
      />
    )
  }

  if (phase === PHASES.tourAfter) {
    return <OnboardingTour scenes={INTRO_SCENES} t={t} language={language} onDone={onNext} />
  }

  return (
    <OnboardingFormStep
      title={t.onboardingPersonTitle}
      body={t.onboardingPersonBody}
      containerRef={formRef}
    >
      <FormCard>
        <PersonForm
          onSave={finish}
          onSkip={(values) => finish(completePracticePerson(values, language, t))}
          skipLabel={t.onboardingSkip}
          zodiacHint={t.onboardingZodiacHint}
          t={t}
          language={language}
          includeHowWeMet={false}
          mode="add"
          saveLabel={t.saveAndBack}
        />
      </FormCard>
    </OnboardingFormStep>
  )
}
