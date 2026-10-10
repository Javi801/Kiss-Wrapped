import { usePalette } from '@/lib/theme'

/**
 * Full-screen onboarding wizard shown to new installs after the intro.
 * It cannot be skipped: the only way out is finishing it.
 *
 * Props:
 *  - t           Active translation dictionary
 *  - onComplete  Called when the user finishes the wizard
 */
export default function OnboardingWizard({ t, onComplete }) {
  const PALETTE = usePalette()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        zIndex: 20,
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${PALETTE.accentMuted}, ${PALETTE.gradientMid}, ${PALETTE.gradientEnd})`,
        paddingTop: 'env(safe-area-inset-top, 1.5rem)',
        paddingBottom: 'env(safe-area-inset-bottom, 1.5rem)',
      }}
    >
      <div style={{ padding: '0 1.125rem 1.125rem' }}>
        <button
          type="button"
          onClick={onComplete}
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
          {t.onboardingFinish}
        </button>
      </div>
    </div>
  )
}
