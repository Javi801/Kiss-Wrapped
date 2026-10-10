import { useState } from 'react'
import { usePalette } from '@/lib/theme'
import { TEXT } from '@/lib/constants'
import OnboardingWelcomeStep from '@/components/app/OnboardingWelcomeStep'

// Ordered wizard steps. The step counter total comes from this list's length.
const ONBOARDING_STEPS = [OnboardingWelcomeStep]

/**
 * Full-screen onboarding wizard shown to new installs after the intro.
 * It cannot be skipped and has no way back: the only way out is finishing it.
 *
 * Props:
 *  - t           Active translation dictionary
 *  - onComplete  Called when the user finishes the wizard
 *  - steps       Step components, rendered in order with the `t` prop
 */
export default function OnboardingWizard({ t, onComplete, steps = ONBOARDING_STEPS }) {
  const PALETTE = usePalette()
  const [stepIndex, setStepIndex] = useState(0)

  const Step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
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
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: '1.125rem',
        }}
      >
        <Step t={t} />
      </div>

      <div style={{ position: 'relative', padding: '0 1.125rem 1.125rem' }}>
        <button
          type="button"
          onClick={isLast ? onComplete : () => setStepIndex(stepIndex + 1)}
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
    </div>
  )
}
