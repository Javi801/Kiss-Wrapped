import { useEffect, useRef, useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import PersonForm from '@/components/forms/PersonForm'
import OnboardingTour from '@/components/app/OnboardingTour'
import { usePalette } from '@/lib/theme'
import { TEXT } from '@/lib/constants'
import { completePracticePerson } from '@/lib/onboarding'

// The home screen, waiting for a tap on its add-person button.
const HOME_SCENES = [{ screen: 'home', note: 'onboardingTourAddNote', guideTarget: 'add' }]

// Saving a person returns to the intro, as in the app. The tap on its heart plays by itself.
const INTRO_SCENES = [{ screen: 'intro', auto: true, duration: 2000 }]

/**
 * Second onboarding step, in three phases: the home screen, where the user taps
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
  const PALETTE = usePalette()
  // 'home' | 'form' | 'intro'
  const [phase, setPhase] = useState('home')
  const formRef = useRef(null)

  // The form replaces the home screen in the same scroll container: start it at its top.
  useEffect(() => {
    if (phase === 'form') formRef.current?.scrollIntoView?.({ block: 'start' })
  }, [phase])

  function finish(person) {
    onPracticePerson(person)
    setPhase('intro')
  }

  if (phase === 'home') {
    return (
      <OnboardingTour
        scenes={HOME_SCENES}
        t={t}
        language={language}
        settings={settings}
        onDone={() => setPhase('form')}
      />
    )
  }

  if (phase === 'intro') {
    return <OnboardingTour scenes={INTRO_SCENES} t={t} language={language} onDone={onNext} />
  }

  return (
    <div
      ref={formRef}
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
