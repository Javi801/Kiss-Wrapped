import { useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import EventForm from '@/components/forms/EventForm'
import OnboardingTour from '@/components/app/OnboardingTour'
import { usePalette } from '@/lib/theme'
import { TEXT } from '@/lib/constants'
import { completePracticeEvent } from '@/lib/onboarding'

// The person card with the saved event, waiting for a tap on the home item of the bottom bar.
const SAVED_SCENES = [
  {
    screen: 'people',
    note: 'onboardingTourSavedNote',
    card: { expanded: true },
    nav: 'main',
  },
]

/**
 * Fourth onboarding step, in two phases: the event form, empty, and the person
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
  const PALETTE = usePalette()
  const [saved, setSaved] = useState(false)
  // Tags added while practicing live only in this step.
  const [placeTags, setPlaceTags] = useState([])
  const [situationTags, setSituationTags] = useState([])

  function finish(event) {
    onPracticeEvent(event)
    setSaved(true)
  }

  if (saved) {
    return (
      <OnboardingTour
        scenes={SAVED_SCENES}
        person={practicePerson}
        t={t}
        language={language}
        settings={settings}
        onDone={onNext}
      />
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '100%',
        maxWidth: '28rem',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center' }}>
        <h1
          style={{
            ...TEXT.heading,
            margin: 0,
            letterSpacing: '-0.025em',
            color: PALETTE.accentEmphasis2,
          }}
        >
          {t.onboardingEventTitle}
        </h1>
        <p style={{ ...TEXT.body, margin: 0, color: PALETTE.textSoft }}>{t.onboardingEventBody}</p>
      </div>

      {/* Same container as the person step */}
      <Card
        className="rounded-3xl"
        style={{
          boxShadow: `0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px ${PALETTE.cardBorder}`,
          backdropFilter: 'blur(12px)',
          border: 'none',
          background: `linear-gradient(160deg, ${PALETTE.card} 0%, ${PALETTE.cardSoft} 100%)`,
        }}
      >
        <CardContent style={{ padding: '1.25rem' }}>
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
        </CardContent>
      </Card>
    </div>
  )
}
