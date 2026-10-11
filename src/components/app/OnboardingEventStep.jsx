import { useState } from 'react'

import EventForm from '@/components/forms/EventForm'
import FormCard from '@/components/app/FormCard'
import OnboardingFormStep from '@/components/app/OnboardingFormStep'
import OnboardingTour from '@/components/app/OnboardingTour'
import { completePracticeEvent } from '@/lib/onboarding'
import { SAVED_EVENT_SCENES } from '@/components/app/onboardingScenes'

// Phases of the step, in order: the form, the tour after it. This step has no tour before the form.
const PHASES = { form: 'form', tourAfter: 'tourAfter' }

/**
 * Onboarding step for the practice event, in two phases: the event form, empty, and the person
 * card with the saved event, where the user taps the home item of the bottom bar.
 * Saving or skipping hands the practice event to the wizard and shows the card;
 * skipping keeps what was typed and fills the rest.
 *
 * Props:
 *  - t                Active translation dictionary
 *  - language         Active language
 *  - practicePerson   Practice person the event is added to
 *  - settings         Settings the home screen shows
 *  - onPracticeEvent  Receives the practice event
 *  - onNext           Moves to the next step
 */
export default function OnboardingEventStep({
  t,
  language,
  practicePerson,
  settings,
  onPracticeEvent,
  onNext,
}) {
  const [phase, setPhase] = useState(PHASES.form)
  // Tags added while practicing live only in this step.
  const [placeTags, setPlaceTags] = useState([])
  const [situationTags, setSituationTags] = useState([])

  function finish(event) {
    onPracticeEvent(event)
    setPhase(PHASES.tourAfter)
  }

  if (phase === PHASES.tourAfter) {
    return (
      <OnboardingTour
        scenes={SAVED_EVENT_SCENES}
        person={practicePerson}
        t={t}
        language={language}
        settings={settings}
        onDone={onNext}
      />
    )
  }

  return (
    <OnboardingFormStep title={t.onboardingEventTitle} body={t.onboardingEventBody}>
      <FormCard>
        <EventForm
          onSave={finish}
          onSkip={(values) => finish(completePracticeEvent(values, t))}
          skipLabel={t.onboardingSkip}
          tagsHint={t.onboardingTagsHint}
          t={t}
          placeTags={placeTags}
          onAddPlaceTag={(tag) => setPlaceTags((prev) => [...prev, tag])}
          situationTags={situationTags}
          onAddSituationTag={(tag) => setSituationTags((prev) => [...prev, tag])}
        />
      </FormCard>
    </OnboardingFormStep>
  )
}
