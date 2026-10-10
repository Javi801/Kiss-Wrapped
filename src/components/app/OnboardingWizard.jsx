import { useState } from 'react'
import { usePalette } from '@/lib/theme'
import { TEXT } from '@/lib/constants'
import OnboardingWelcomeStep from '@/components/app/OnboardingWelcomeStep'
import OnboardingPersonStep from '@/components/app/OnboardingPersonStep'

// Ordered wizard steps. The step counter total comes from this list's length.
// A step with `ownsActions` renders its own buttons and advances through `onNext`.
const ONBOARDING_STEPS = [
  { Component: OnboardingWelcomeStep },
  { Component: OnboardingPersonStep, ownsActions: true },
]

/**
 * Full-screen onboarding wizard shown to new installs after the intro.
 * It cannot be skipped and has no way back: the only way out is finishing it.
 *
 * Props:
 *  - t           Active translation dictionary
 *  - language    Active language
 *  - onComplete  Called when the user finishes the wizard
 *  - steps       Step entries `{ Component, ownsActions }`, rendered in order
 */
export default function OnboardingWizard({ t, language, onComplete, steps = ONBOARDING_STEPS }) {
  const PALETTE = usePalette()
  const [stepIndex, setStepIndex] = useState(0)
  // Person created in the wizard for the later steps. It is never saved.
  const [practicePerson, setPracticePerson] = useState(null)

  const { Component: Step, ownsActions } = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const goNext = isLast ? onComplete : () => setStepIndex(stepIndex + 1)
  const stepCount = t.onboardingStepCount
    .replace('{current}', stepIndex + 1)
    .replace('{total}', steps.length)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
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
            background: 'radial-gradient(circle at top, rgba(255,255,255,0.95), transparent 45%)',
          }}
        />
      )}

      <div style={{ position: 'relative', padding: '1.125rem 1.125rem 0' }}>
        <span style={{ ...TEXT.label, color: PALETTE.textSoft }}>{stepCount}</span>
      </div>

      <div
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
          <Step
            t={t}
            language={language}
            practicePerson={practicePerson}
            onPracticePerson={setPracticePerson}
            onNext={goNext}
          />
        </div>
      </div>

      {ownsActions ? null : (
        <div style={{ position: 'relative', padding: '0 1.125rem 1.125rem' }}>
          <button
            type="button"
            onClick={goNext}
            style={{
              width: '100%',
              minHeight: '2.75rem',
              padding: '0 0.8125rem',
              borderRadius: '1rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.86rem',
              fontWeight: 750,
              color: '#ffffff',
              background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
            }}
          >
            {isLast ? t.onboardingFinish : t.onboardingNext}
          </button>
        </div>
      )}
    </div>
  )
}
