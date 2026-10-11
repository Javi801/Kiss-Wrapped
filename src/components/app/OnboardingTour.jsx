import { useEffect, useRef, useState } from 'react'

import HomeScreen from '@/components/app/HomeScreen'
import IntroScreen from '@/components/app/IntroScreen'
import PeopleManagerScreen from '@/components/people/PeopleManagerScreen'
import BottomNav from '@/components/app/BottomNav'
import OnboardingButton from '@/components/app/OnboardingButton'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import { setInertExcept } from '@/lib/inert'

// Time an automatic scene stays on screen unless it sets its own `duration`.
export const TOUR_SCENE_MS = 1800
// Time a scene waits for its tap before it moves on by itself.
export const TOUR_TAP_MS = 8000

const noop = () => {}

// What stays reachable on the screens: the speech bubbles, so they are still read
// aloud, and the control a scene asks the user to tap.
const TOUR_KEEP_SELECTOR = '[role="note"], [data-tour-target]'

/**
 * Plays a guided tour over the real screens, fed with the practice person.
 * Nothing on the screens reacts to taps, the keyboard or assistive technology,
 * except the control a scene waits on.
 *
 * Props:
 *  - scenes      Ordered scenes: `{ screen: 'home' | 'people' | 'intro', note, auto, duration,
 *                button, guideTarget, hint, card, nav, tapOnly }`. `note`, `button` and the `hint` fields
 *                are translation keys. An `auto` scene moves on by itself, after `duration` ms when given, and a scene
 *                with `button` moves on from that button; any other waits for a tap on the
 *                control it points at: the `guideTarget` button of the home screen (`'add'`
 *                or `'people'`), the `card.tapTarget` or the `nav` item. Without that tap
 *                it moves on by itself after `TOUR_TAP_MS`, unless it is `tapOnly`.
 *                `guideTarget` is what the home screen points at, with `hint`
 *                (`{ title, body }`) as its text; a scene with `hint` dims everything else. `card` guides the person card:
 *                `{ expanded, tapTarget, hints }`. `nav` shows the bottom bar with the
 *                tap guide on that item. The `'intro'` screen shows the tap guide on its heart.
 *  - person      Practice person shown on the screens, once there is one
 *  - settings    `theme`, `iconColor`, `statsVisible` and `includePartnerEvents` for the home screen
 *  - onDone      Called when the last scene ends
 */
export default function OnboardingTour({
  scenes,
  person,
  t,
  language,
  settings = {},
  onDone,
}) {
  const PALETTE = usePalette()
  const [sceneIndex, setSceneIndex] = useState(0)
  const rootRef = useRef(null)
  const screensRef = useRef(null)

  const scene = scenes[sceneIndex]
  const isLast = sceneIndex === scenes.length - 1
  const people = person ? [person] : []

  function endScene() {
    if (isLast) onDone?.()
    else setSceneIndex(sceneIndex + 1)
  }

  // Only the control a scene points at is reachable, so any tap comes from it.
  const onTap = scene.auto || scene.button ? noop : endScene

  // A scene with a button, or `tapOnly`, waits; any other tap scene only for a while.
  let sceneMs = TOUR_TAP_MS
  if (scene.auto) sceneMs = scene.duration ?? TOUR_SCENE_MS
  else if (scene.button || scene.tapOnly) sceneMs = null

  // Depends on the scene index so each timed scene gets its own timer.
  useEffect(() => {
    if (sceneMs === null) return undefined
    const timer = setTimeout(() => {
      if (isLast) onDone?.()
      else setSceneIndex((index) => index + 1)
    }, sceneMs)
    return () => clearTimeout(timer)
  }, [sceneIndex, sceneMs, isLast, onDone])

  // Taps are already blocked by the wrapper; this also takes the screens out of the
  // keyboard and of assistive technology. Redone per scene, as each one renders its own.
  useEffect(() => setInertExcept(screensRef.current, TOUR_KEEP_SELECTOR), [sceneIndex])

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

      {/* The tour drives the screens: taps do nothing outside the control a scene waits on. */}
      <div ref={screensRef} style={{ pointerEvents: 'none' }}>
        {scene.screen === 'intro' ? (
          <IntroScreen onOpenMain={noop} showEntryGuide entryGuideCallout={false} t={t} />
        ) : scene.screen === 'home' ? (
          <HomeScreen
            onNavigate={onTap}
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
                onToggle: onTap,
                onAddEvent: onTap,
              }
            }
          />
        )}
        {scene.nav && (
          <BottomNav screen={scene.screen} onNavigate={onTap} guideTarget={scene.nav} t={t} />
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
