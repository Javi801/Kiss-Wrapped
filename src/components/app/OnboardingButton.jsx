import { usePalette } from '@/lib/theme'

/**
 * Full-width primary button of the onboarding wizard.
 */
export default function OnboardingButton({ onClick, children }) {
  const PALETTE = usePalette()

  return (
    <button
      type="button"
      onClick={onClick}
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
      {children}
    </button>
  )
}
