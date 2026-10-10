import { Card, CardContent } from '@/components/ui/card'
import PersonForm from '@/components/forms/PersonForm'
import { usePalette } from '@/lib/theme'
import { TEXT } from '@/lib/constants'
import { completePracticePerson } from '@/lib/onboarding'

/**
 * Second onboarding step: the person form as the date sees it, empty.
 * Saving or skipping hands the practice person to the wizard and moves on;
 * skipping keeps what was typed and fills the rest.
 *
 * Props:
 *  - t                 Active translation dictionary
 *  - language          Active language, for the zodiac options
 *  - onPracticePerson  Receives the practice person
 *  - onNext            Moves to the next step
 */
export default function OnboardingPersonStep({ t, language, onPracticePerson, onNext }) {
  const PALETTE = usePalette()

  function finish(person) {
    onPracticePerson(person)
    onNext()
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
          {t.onboardingPersonTitle}
        </h1>
        <p style={{ ...TEXT.body, margin: 0, color: PALETTE.textSoft }}>{t.onboardingPersonBody}</p>
      </div>

      {/* Same container as AddPersonScreen */}
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
        </CardContent>
      </Card>
    </div>
  )
}
