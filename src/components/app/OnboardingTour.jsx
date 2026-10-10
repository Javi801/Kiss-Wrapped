import { useEffect, useState } from 'react'

import HomeScreen from '@/components/app/HomeScreen'
import PeopleManagerScreen from '@/components/people/PeopleManagerScreen'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

// Time an automatic scene stays on screen.
export const TOUR_SCENE_MS = 1800

const noop = () => {}

/**
 * Plays a guided tour over the real screens, fed with the practice person.
 * Nothing on the screens reacts to taps, except the add-event button of a
 * scene that points at it.
 *
 * Props:
 *  - scenes      Ordered scenes: `{ screen: 'home' | 'people', note, auto, guideTarget, card }`.
 *                `note` is a translation key. An `auto` scene moves on by itself.
 *                `guideTarget` is the home button to tap. `card` guides the person card:
 *                `{ expanded, tapTarget, hints }`.
 *  - person      Practice person shown on the screens
 *  - settings    `theme`, `iconColor`, `statsVisible` and `includePartnerEvents` for the home screen
 *  - onAddEvent  Called from the add-event button
 *  - onDone      Called when the last scene is automatic and its time is up
 */
export default function OnboardingTour({
  scenes,
  person,
  t,
  language,
  settings = {},
  onAddEvent,
  onDone,
}) {
  const PALETTE = usePalette()
  const [sceneIndex, setSceneIndex] = useState(0)

  const scene = scenes[sceneIndex]
  const isLast = sceneIndex === scenes.length - 1
  const people = [person]

  // Depends on the scene index so each automatic scene gets its own timer.
  useEffect(() => {
    if (!scene.auto) return undefined
    const timer = setTimeout(() => {
      if (isLast) onDone?.()
      else setSceneIndex((index) => index + 1)
    }, TOUR_SCENE_MS)
    return () => clearTimeout(timer)
  }, [sceneIndex, scene.auto, isLast, onDone])

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
      <p
        role="status"
        style={{
          ...TEXT.bodyStrong,
          margin: 0,
          padding: '0.625rem 0.875rem',
          borderRadius: '1rem',
          textAlign: 'center',
          color: PALETTE.accentEmphasis2,
          border: `1px solid ${PALETTE.cardBorder}`,
          backgroundColor: PALETTE.card,
        }}
      >
        {t[scene.note]}
      </p>

      {/* The tour drives the screens: taps do nothing. */}
      <div style={{ pointerEvents: 'none' }}>
        {scene.screen === 'home' ? (
          <HomeScreen
            onNavigate={noop}
            onClearData={noop}
            onImportData={noop}
            people={people}
            t={t}
            language={language}
            setLanguage={noop}
            iconColor={settings.iconColor}
            setIconColor={noop}
            theme={settings.theme}
            setTheme={noop}
            statsVisible={settings.statsVisible}
            setStatsVisible={noop}
            includePartnerEvents={settings.includePartnerEvents}
            guideTarget={scene.guideTarget}
          />
        ) : (
          <PeopleManagerScreen
            people={people}
            onUpdatePerson={noop}
            onDeletePerson={noop}
            onAddEvent={noop}
            onUpdateEvent={noop}
            onDeleteEvent={noop}
            onDeleteAllEvents={noop}
            t={t}
            language={language}
            situationTags={[]}
            onAddSituationTag={noop}
            placeTags={[]}
            onAddPlaceTag={noop}
            howWeMetTags={[]}
            onAddHowWeMetTag={noop}
            cardGuide={
              scene.card && {
                expanded: scene.card.expanded,
                tapTarget: scene.card.tapTarget,
                editHint: scene.card.hints ? t.onboardingEditPersonHint : undefined,
                eventHint: scene.card.hints ? t.onboardingEventHint : undefined,
                onAddEvent,
              }
            }
          />
        )}
      </div>
    </div>
  )
}
