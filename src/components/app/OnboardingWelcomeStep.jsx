import { usePalette } from '@/lib/theme'
import { TEXT } from '@/lib/constants'
import HeroVisualPlaceholder from '@/components/visuals/HeroVisualPlaceholder'

/**
 * Welcome step of the onboarding: welcomes the user and states that the data stays on the device.
 *
 * Props:
 *  - t  Active translation dictionary
 */
export default function OnboardingWelcomeStep({ t }) {
  const PALETTE = usePalette()
  const leadStyle = { ...TEXT.body, margin: 0, color: PALETTE.textSoft }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        textAlign: 'center',
      }}
    >
      <HeroVisualPlaceholder size={11} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxWidth: '20rem',
        }}
      >
        <h1 style={{ ...TEXT.heading, margin: 0, color: PALETTE.accentEmphasis2 }}>
          {t.onboardingWelcomeTitle}
        </h1>
        <p style={leadStyle}>{t.onboardingWelcomeLead}</p>
        <p style={leadStyle}>{t.onboardingWelcomePrivacy}</p>
      </div>
    </div>
  )
}
