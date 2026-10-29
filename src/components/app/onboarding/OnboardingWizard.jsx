import { useState } from 'react'
import { usePalette } from '@/lib/theme'
import { TEXT } from '@/lib/constants'
import OnboardingWelcomeStep from '@/components/app/onboarding/OnboardingWelcomeStep'
import OnboardingPersonStep from '@/components/app/onboarding/OnboardingPersonStep'
import OnboardingEventStep from '@/components/app/onboarding/OnboardingEventStep'
import OnboardingTour from '@/components/app/onboarding/OnboardingTour'
import OnboardingButton from '@/components/app/onboarding/OnboardingButton'
import { HOME_HINT_SCENES, PERSON_CARD_SCENES } from '@/components/app/onboarding/onboardingScenes'
import { createPerson, uid } from '@/lib/helpers'
import { fillPlaceholders } from '@/lib/format'
import { TOUR_LAYERS } from '@/lib/onboarding'

// Ordered wizard steps. The step counter total comes from this list's length.
// A step is a component, `{ Component, ownsActions }`, or a tour, `{ scenes }`.
// A component with `ownsActions` renders its own buttons and advances through `onNext`.
// A tour plays its scenes over the real screens and advances when the last one ends.
const ONBOARDING_STEPS = [
  { Component: OnboardingWelcomeStep },
  { Component: OnboardingPersonStep, ownsActions: true },
  { scenes: PERSON_CARD_SCENES },
  { Component: OnboardingEventStep, ownsActions: true },
  { scenes: HOME_HINT_SCENES },
]

/**
 * Full-screen onboarding wizard, shown to new installs after the intro and again
 * from the settings. It cannot be skipped and has no way back between steps.
 *
 * Props:
 *  - t           Active translation dictionary
 *  - language    Active language
 *  - settings    Settings the home screen of the tour shows
 *  - onComplete  Called when the user finishes the wizard
 *  - steps       Step entries, rendered in order: `{ Component, ownsActions }` for a
 *                component, or `{ scenes }` for a scene list played by `OnboardingTour`,
 *                which always owns its actions
 */
export default function OnboardingWizard({
  t,
  language,
  settings,
  onComplete,
  steps = ONBOARDING_STEPS,
}) {
  const PALETTE = usePalette()
  const [stepIndex, setStepIndex] = useState(0)
  // Person created in the wizard for the later steps, with its events. It is never saved.
  const [practicePerson, setPracticePerson] = useState(null)

  const { Component: Step, scenes, ownsActions } = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const goNext = isLast ? onComplete : () => setStepIndex(stepIndex + 1)

  function addPracticeEvent(values) {
    setPracticePerson((person) => ({
      ...person,
      events: [{ id: uid(), ...values }, ...person.events],
    }))
  }
  const stepCount = fillPlaceholders(t.onboardingStepCount, {
    current: stepIndex + 1,
    total: steps.length,
  })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: TOUR_LAYERS.wizard,
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${PALETTE.accentMuted}, ${PALETTE.gradientMid}, ${PALETTE.gradientEnd})`,
        paddingTop: 'env(safe-area-inset-top, 1.5rem)',
        paddingBottom: 'env(safe-area-inset-bottom, 1.5rem)',
      }}
    >
      {/* Top radial overlay, as in the intro. Skipped in dark so the text keeps its contrast. */}
      {PALETTE.isDark ? null : (
        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at top, ${PALETTE.topGlow}, transparent 45%)`,
          }}
        />
      )}

      <div style={{ position: 'relative', padding: '1.125rem 1.125rem 0' }}>
        <span style={{ ...TEXT.label, color: PALETTE.textSoft }}>{stepCount}</span>
      </div>

      {/* Keyed by step so each one starts scrolled to its top. */}
      <div
        key={stepIndex}
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '1.125rem',
        }}
      >
        {/* Auto margins center a short step and let a tall one scroll from its top. */}
        <div style={{ width: '100%', margin: 'auto 0' }}>
          {scenes ? (
            <OnboardingTour
              scenes={scenes}
              person={practicePerson}
              t={t}
              language={language}
              settings={settings}
              onDone={goNext}
            />
          ) : (
            <Step
              t={t}
              language={language}
              settings={settings}
              practicePerson={practicePerson}
              onPracticePerson={(values) => setPracticePerson(createPerson(values))}
              onPracticeEvent={addPracticeEvent}
              onNext={goNext}
            />
          )}
        </div>
      </div>

      {scenes || ownsActions ? null : (
        <div style={{ position: 'relative', padding: '0 1.125rem 1.125rem' }}>
          <OnboardingButton onClick={goNext}>
            {isLast ? t.onboardingFinish : t.onboardingNext}
          </OnboardingButton>
        </div>
      )}
    </div>
  )
}
