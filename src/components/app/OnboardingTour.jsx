import { useEffect, useRef, useState } from 'react'

import HomeScreen from '@/components/app/HomeScreen'
import PeopleManagerScreen from '@/components/people/PeopleManagerScreen'
import BottomNav from '@/components/app/BottomNav'
import OnboardingButton from '@/components/app/OnboardingButton'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

// Time an automatic scene stays on screen unless it sets its own `duration`.
export const TOUR_SCENE_MS = 1800

const noop = () => {}

/**
 * Plays a guided tour over the real screens, fed with the practice person.
 * Nothing on the screens reacts to taps, except the add-event button of a
 * scene that points at it.
 *
 * Props:
 *  - scenes      Ordered scenes: `{ screen: 'home' | 'people', note, auto, duration, button,
 *                guideTarget, hint, card, nav }`. `note`, `button` and the `hint` fields
 *                are translation keys. An `auto` scene moves on by itself, after `duration` ms when given, and a scene
 *                with `button` moves on from that button; any other waits for `onAddEvent`.
 *                `guideTarget` is what the home screen points at, with `hint`
 *                (`{ title, body }`) as its text; a scene with `hint` dims everything else. `card` guides the person card:
 *                `{ expanded, tapTarget, hints }`. `nav` shows the bottom bar with the
 *                tap guide on that item.
 *  - person      Practice person shown on the screens
 *  - settings    `theme`, `iconColor`, `statsVisible` and `includePartnerEvents` for the home screen
 *  - onAddEvent  Called from the add-event button
 *  - onDone      Called when the last scene ends by itself or from its button
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
  const rootRef = useRef(null)

  const scene = scenes[sceneIndex]
  const isLast = sceneIndex === scenes.length - 1
  const people = [person]

  function endScene() {
    if (isLast) onDone?.()
    else setSceneIndex(sceneIndex + 1)
  }

  // Depends on the scene index so each automatic scene gets its own timer.
  useEffect(() => {
    if (!scene.auto) return undefined
    const timer = setTimeout(() => {
      if (isLast) onDone?.()
      else setSceneIndex((index) => index + 1)
    }, scene.duration ?? TOUR_SCENE_MS)
    return () => clearTimeout(timer)
  }, [sceneIndex, scene.auto, scene.duration, isLast, onDone])

  // Brings the first speech bubble of the scene into view, or its top when it has none.
  useEffect(() => {
    const root = rootRef.current
    const bubble = root.querySelector('[role="note"]')
    const target = bubble ?? root
    target.scrollIntoView?.({ block: bubble ? 'center' : 'start', behavior: 'smooth' })
  }, [sceneIndex])

  return (
    <div
      ref={rootRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '100%',
        maxWidth: '28rem',
        margin: '0 auto',
      }}
    >
      {scene.note && (
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
      )}

      {/* Spotlight: the home screen lifts the hinted controls and their bubble above it. */}
      {scene.hint && (
        <div
          data-tour-backdrop=""
          style={{
            pointerEvents: 'none',
            position: 'fixed',
            inset: 0,
            zIndex: 1,
            backgroundColor: 'rgba(24,14,34,0.6)',
          }}
        />
      )}

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
            guideHint={scene.hint && { title: t[scene.hint.title], body: t[scene.hint.body] }}
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
        {scene.nav && (
          <BottomNav screen={scene.screen} onNavigate={noop} guideTarget={scene.nav} t={t} />
        )}
      </div>

      {scene.button && (
        <div style={{ position: 'sticky', bottom: 0, zIndex: 3 }}>
          <OnboardingButton onClick={endScene}>{t[scene.button]}</OnboardingButton>
        </div>
      )}
    </div>
  )
}
