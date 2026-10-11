import { useCallback, useEffect, useRef, useState } from 'react'

import HomeScreen from '@/components/app/HomeScreen'
import IntroScreen from '@/components/app/IntroScreen'
import PeopleManagerScreen from '@/components/people/PeopleManagerScreen'
import BottomNav from '@/components/app/BottomNav'
import OnboardingButton from '@/components/app/onboarding/OnboardingButton'
import { TEXT, SCREENS, CONTENT_MAX_WIDTH } from '@/lib/constants'
import { ONBOARDING } from '@/lib/config'
import { usePalette } from '@/lib/theme'
import { setInertExcept } from '@/lib/inert'
import { SPEECH_BUBBLE_SELECTOR, TOUR_KEEP_SELECTOR, TOUR_LAYERS } from '@/lib/onboarding'

const noop = () => {}

/** The intro screen of a tour scene, with the tap guide on its heart. */
function IntroScene({ t }) {
  return <IntroScreen onOpenMain={noop} showEntryGuide entryGuideCallout={false} t={t} />
}

/** The home screen of a tour scene, pointing at `scene.tourTarget`. */
function HomeScene({ scene, people, t, language, settings, onTap }) {
  return (
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
      tourTarget={scene.tourTarget}
      tourHint={scene.hint && { title: t[scene.hint.title], body: t[scene.hint.body] }}
    />
  )
}

/** The people screen of a tour scene, with the person card guided by `scene.card`. */
function PeopleScene({ scene, people, t, language, onTap }) {
  return (
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
      cardTour={
        scene.card && {
          expanded: scene.card.expanded,
          tapTarget: scene.card.tapTarget,
          editHint: scene.card.hints ? t[scene.card.hints.edit] : undefined,
          eventHint: scene.card.hints ? t[scene.card.hints.event] : undefined,
          onToggle: onTap,
          onAddEvent: onTap,
        }
      }
    />
  )
}

// What renders each screen a scene can name: the real screen fed with the practice person,
// every handler inert except `onTap`, which goes to the control the scene waits on.
const SCENE_SCREENS = {
  [SCREENS.intro]: IntroScene,
  [SCREENS.main]: HomeScene,
  [SCREENS.people]: PeopleScene,
}

/**
 * Plays a guided tour over the real screens, fed with the practice person.
 * Nothing on the screens reacts to taps, the keyboard or assistive technology,
 * except the control a scene waits on.
 *
 * Props:
 *  - scenes      Ordered scenes: `{ screen: SCREENS.main | SCREENS.people | SCREENS.intro,
 *                instruction, auto, duration, button, tourTarget, hint, card, nav, tapOnly }`.
 *                `instruction`, `button` and the fields of `hint` and `card.hints` are
 *                translation keys. An `auto` scene moves on by itself, after `duration` ms when given, and a scene
 *                with `button` moves on from that button; any other waits for a tap on the
 *                control it points at: the `tourTarget` button of the home screen (`SCREENS.add`
 *                or `SCREENS.people`), the `card.tapTarget` or the `nav` item. Without that tap
 *                it moves on by itself after `ONBOARDING.tapTimeoutMs`, unless it is `tapOnly`.
 *                `tourTarget` is what the home screen points at: one of those two buttons, or
 *                `TOUR_TARGETS.data` or `TOUR_TARGETS.settings` with `hint`
 *                (`{ title, body }`) as its text; a scene with `hint` dims everything else. `card` guides the person card:
 *                `{ expanded, tapTarget, hints }`, where `tapTarget` is `TOUR_TARGETS.card` or
 *                `TOUR_TARGETS.addEvent` and `hints` is `{ edit, event }`. `nav` shows the bottom
 *                bar with the tap guide on the item of that screen. The intro screen shows the
 *                tap guide on its heart. A scene naming any other screen renders no screen.
 *  - person      Practice person shown on the screens, once there is one
 *  - settings    `theme`, `iconColor`, `statsVisible` and `includePartnerEvents` for the home screen
 *  - onDone      Called when the last scene ends
 */
export default function OnboardingTour({ scenes, person, t, language, settings = {}, onDone }) {
  const PALETTE = usePalette()
  const [sceneIndex, setSceneIndex] = useState(0)
  const rootRef = useRef(null)
  const screensRef = useRef(null)

  const scene = scenes[sceneIndex]
  const isLast = sceneIndex === scenes.length - 1
  const people = person ? [person] : []

  // Latest `onDone`, read when the tour ends, so a new one does not restart a scene's timer.
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  // Ends the scene, whether from its tap, its button or its timer.
  const advance = useCallback(() => {
    if (isLast) onDoneRef.current?.()
    else setSceneIndex(sceneIndex + 1)
  }, [isLast, sceneIndex])

  // Only the control a scene points at is reachable, so any tap comes from it.
  const onTap = scene.auto || scene.button ? noop : advance

  // A scene with a button, or `tapOnly`, waits; any other tap scene only for a while.
  let sceneMs = ONBOARDING.tapTimeoutMs
  if (scene.auto) sceneMs = scene.duration ?? ONBOARDING.sceneMs
  else if (scene.button || scene.tapOnly) sceneMs = null

  // `advance` changes with the scene index, so each timed scene gets its own timer.
  useEffect(() => {
    if (sceneMs === null) return undefined
    const timer = setTimeout(advance, sceneMs)
    return () => clearTimeout(timer)
  }, [advance, sceneMs])

  // Undefined for a screen the tour does not know, which then renders none.
  const SceneScreen = SCENE_SCREENS[scene.screen]

  // Taps are already blocked by the wrapper; this also takes the screens out of the
  // keyboard and of assistive technology. Redone per scene, as each one renders its own.
  useEffect(() => setInertExcept(screensRef.current, TOUR_KEEP_SELECTOR), [sceneIndex])

  // Brings the first speech bubble of the scene into view, or its top when it has none.
  useEffect(() => {
    const root = rootRef.current
    const bubble = root.querySelector(SPEECH_BUBBLE_SELECTOR)
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
        maxWidth: CONTENT_MAX_WIDTH,
        margin: '0 auto',
      }}
    >
      {scene.instruction && (
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
          {t[scene.instruction]}
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
            zIndex: TOUR_LAYERS.backdrop,
            backgroundColor: PALETTE.backdrop,
          }}
        />
      )}

      {/* The tour drives the screens: taps do nothing outside the control a scene waits on. */}
      <div ref={screensRef} style={{ pointerEvents: 'none' }}>
        {SceneScreen && (
          <SceneScreen
            scene={scene}
            people={people}
            t={t}
            language={language}
            settings={settings}
            onTap={onTap}
          />
        )}
        {scene.nav && (
          <BottomNav screen={scene.screen} onNavigate={onTap} tourTarget={scene.nav} t={t} />
        )}
      </div>

      {scene.button && (
        <div style={{ position: 'sticky', bottom: 0, zIndex: TOUR_LAYERS.button }}>
          <OnboardingButton onClick={advance}>{t[scene.button]}</OnboardingButton>
        </div>
      )}
    </div>
  )
}
