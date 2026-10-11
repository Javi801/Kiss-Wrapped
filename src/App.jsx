import React, { Suspense, lazy, useEffect, useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

import { PALETTES, TEXT, COPY, SCREENS } from '@/lib/constants'
import { FEATURES } from '@/lib/config'
import { ThemeProvider } from '@/lib/theme'
import { CopyProvider } from '@/lib/copy'
import { setAppIconColor } from '@/plugins/appicon'
import {
  uid,
  createPerson,
  normalizePeople,
  mergeEventTagsFromPeople,
  mergePeopleFieldTags,
} from '@/lib/helpers'
import { hasScore } from '@/lib/format'
import { clearPeopleFromDevice } from '@/lib/device-storage'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { usePrivacyOverlay } from '@/hooks/usePrivacyOverlay'
import { usePersistedAppState } from '@/hooks/usePersistedAppState'

import PeopleManagerScreen from '@/components/people/PeopleManagerScreen'
import HomeScreen from './components/app/HomeScreen'
import AddPersonScreen from './components/app/AddPersonScreen'
import IntroScreen from './components/app/IntroScreen'
import BottomNav from './components/app/BottomNav'
import OnboardingWizard from './components/app/OnboardingWizard'
import PrivacyScreen from './components/app/PrivacyScreen'

// Loaded on demand so the charting libraries stay out of the initial chunk.
const loadStatsScreen = () => import('@/components/stats/StatsScreen')
const StatsScreen = lazy(loadStatsScreen)

/**
 * Main app container.
 * It manages global app state, persistence, navigation, and data mutations.
 */
export default function KissWrappedApp() {
  const { screen, setScreen, navigateTo, resetTo, modalBackRef } = useAppNavigation()

  // Notice shown on the dashboard right after the onboarding ends.
  const [onboardingDoneOpen, setOnboardingDoneOpen] = useState(false)
  const closeOnboardingDone = useCallback(() => setOnboardingDoneOpen(false), [])

  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [screen])

  // Fetches the stats chunk after the first render so opening the screen does not wait for it.
  useEffect(() => {
    loadStatsScreen().catch(() => { })
  }, [])

  // True while the app is backgrounded — triggers the privacy overlay.
  const isPrivate = usePrivacyOverlay()

  const {
    people,
    setPeople,
    language,
    setLanguage,
    iconColor,
    setIconColor,
    theme,
    setTheme,
    statsVisible,
    setStatsVisible,
    includePartnerEvents,
    setIncludePartnerEvents,
    situationTags,
    setSituationTags,
    placeTags,
    setPlaceTags,
    howWeMetTags,
    setHowWeMetTags,
    onboardingPending,
    completeOnboarding,
  } = usePersistedAppState(setScreen)

  // Applies the dark class to <html> so shadcn portal components also get dark styles.
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Switches the icon from user actions only, because Android may kill the app while changing aliases.
  async function changeIconColor(newColor) {
    setIconColor(newColor)
    setAppIconColor(newColor)
  }

  function changeTheme(newTheme) {
    setTheme(newTheme)
  }

  // Active translation dictionary.
  const t = COPY[language]

  // Adds a new situation tag if it doesn't already exist.
  function addSituationTag(tag) {
    setSituationTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]))
  }

  // Adds a new place tag if it doesn't already exist.
  function addPlaceTag(tag) {
    setPlaceTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]))
  }

  // Adds a new how-we-met tag if it doesn't already exist.
  function addHowWeMetTag(tag) {
    setHowWeMetTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]))
  }

  // Clears all app data and resets the app to its initial state.
  async function clearAllAppData() {
    try {
      await clearPeopleFromDevice()
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to clear app data', error)
    }

    setPeople([])
    resetTo(SCREENS.intro)
  }

  // Registers the place and situation values used by the given people's events as tags.
  function registerEventTags(sourcePeople) {
    setSituationTags((prev) => mergeEventTagsFromPeople(sourcePeople, prev, 'situation'))
    setPlaceTags((prev) => mergeEventTagsFromPeople(sourcePeople, prev, 'place'))
  }

  // Registers the how-we-met values of the given people as tags.
  function registerHowWeMetTags(sourcePeople) {
    setHowWeMetTags((prev) => mergePeopleFieldTags(sourcePeople, prev, 'howWeMet'))
  }

  // Appends imported people (already deduplicated by the caller) to the existing dataset.
  function importAppData(rawPeople) {
    const importedPeople = normalizePeople(rawPeople)
    setPeople((prev) => [...prev, ...importedPeople])
    registerEventTags(importedPeople)
    registerHowWeMetTags(importedPeople)
  }

  // Creates a new person and inserts an initial empty event.
  function addPerson(values) {
    const newPerson = createPerson(values)

    setPeople((prev) => [newPerson, ...prev])
    registerHowWeMetTags([newPerson])

    // Return to the entry screen after saving.
    resetTo(SCREENS.intro)
  }

  // Updates a person's main profile fields.
  function updatePerson(personId, values) {
    setPeople((prev) =>
      prev.map((person) => (person.id === personId ? { ...person, ...values } : person))
    )
    registerHowWeMetTags([values])
  }

  // Deletes a person completely from the dataset.
  function deletePerson(personId) {
    setPeople((prev) => prev.filter((person) => person.id !== personId))
  }

  // Adds a new event to a person. Invalid scores are normalized to null.
  function addEvent(personId, values) {
    setPeople((prev) =>
      prev.map((person) =>
        person.id === personId
          ? {
            ...person,
            events: [
              {
                id: uid(),
                ...values,
                score: hasScore(values.score) ? values.score : null,
              },
              ...(person.events || []),
            ],
          }
          : person
      )
    )
    registerEventTags([{ events: [values] }])
  }

  // Updates a specific event for a person. Invalid scores are normalized to null.
  function updateEvent(personId, eventId, values) {
    setPeople((prev) =>
      prev.map((person) =>
        person.id === personId
          ? {
            ...person,
            events: (person.events || []).map((event) =>
              event.id === eventId
                ? {
                  ...event,
                  ...values,
                  score: hasScore(values.score) ? values.score : null,
                }
                : event
            ),
          }
          : person
      )
    )
    registerEventTags([{ events: [values] }])
  }

  // Deletes one event from a person.
  function deleteEvent(personId, eventId) {
    setPeople((prev) =>
      prev.map((person) =>
        person.id === personId
          ? {
            ...person,
            events: (person.events || []).filter((event) => event.id !== eventId),
          }
          : person
      )
    )
  }

  // Deletes all events for a person while preserving the person record.
  function deleteAllEvents(personId) {
    setPeople((prev) =>
      prev.map((person) => (person.id === personId ? { ...person, events: [] } : person))
    )
  }

  /**
   * Called when the user finishes the onboarding wizard, on the first run or after
   * restarting it from the settings.
   * Marks onboarding as done (triggers the save effect) and opens the dashboard
   * with the notice that points to the rest of the help.
   */
  function handleOnboardingComplete() {
    completeOnboarding()
    setOnboardingDoneOpen(true)
    resetTo(SCREENS.main)
  }

  // Hide bottom navigation on screens that use a focused layout.
  const hideBottomBar =
    screen === SCREENS.boot ||
    screen === SCREENS.add ||
    screen === SCREENS.intro ||
    screen === SCREENS.onboarding

  const palette = PALETTES[theme] ?? PALETTES.pink

  return (
    <ThemeProvider theme={theme}>
      <CopyProvider language={language}>
        <div
          style={{
            height: '100vh',
            color: palette.text,
            background: `linear-gradient(180deg, ${palette.bgGradientFrom}, ${palette.bgSoft}, ${palette.gradientEnd})`,

            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              margin: '0 auto',
              display: 'flex',
              height: '100%',
              width: '100%',
              maxWidth: '28rem',
              flexDirection: 'column',
              paddingLeft: '1rem',
              paddingRight: '1rem',
            }}
          >
            {/* Main animated content area */}
            <motion.div
              ref={scrollRef}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                flex: '1 1 0%',
                overflowY: 'scroll',
                paddingTop: '1.5rem',
                paddingBottom: '5.5rem',
                scrollPaddingTop: '1rem',
                scrollPaddingBottom: '1.5rem',
                WebkitOverflowScrolling: 'touch',
                maskImage:
                  'linear-gradient(to bottom, transparent 0px, black 20px, black calc(100% - 20px), transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, transparent 0px, black 20px, black calc(100% - 20px), transparent 100%)',
              }}
            >
              {/* Main dashboard */}
              {screen === SCREENS.main ? (
                <HomeScreen
                  onNavigate={navigateTo}
                  onClearData={clearAllAppData}
                  onImportData={importAppData}
                  people={people}
                  t={t}
                  language={language}
                  setLanguage={setLanguage}
                  iconColor={iconColor}
                  setIconColor={changeIconColor}
                  theme={theme}
                  setTheme={changeTheme}
                  statsVisible={statsVisible}
                  setStatsVisible={setStatsVisible}
                  includePartnerEvents={includePartnerEvents}
                  modalBackRef={modalBackRef}
                  onRestartOnboarding={
                    FEATURES.onboarding ? () => navigateTo(SCREENS.onboarding) : undefined
                  }
                  onboardingDoneOpen={onboardingDoneOpen}
                  onCloseOnboardingDone={closeOnboardingDone}
                />
              ) : null}

              {/* Add person flow */}
              {screen === SCREENS.add ? (
                <AddPersonScreen
                  onSave={addPerson}
                  onBack={() => setScreen(SCREENS.intro)}
                  t={t}
                  language={language}
                />
              ) : null}

              {/* People management screen */}
              {screen === SCREENS.people ? (
                <PeopleManagerScreen
                  people={people}
                  onUpdatePerson={updatePerson}
                  onDeletePerson={deletePerson}
                  onAddEvent={addEvent}
                  onUpdateEvent={updateEvent}
                  onDeleteEvent={deleteEvent}
                  onDeleteAllEvents={deleteAllEvents}
                  t={t}
                  language={language}
                  modalBackRef={modalBackRef}
                  situationTags={situationTags}
                  onAddSituationTag={addSituationTag}
                  placeTags={placeTags}
                  onAddPlaceTag={addPlaceTag}
                  howWeMetTags={howWeMetTags}
                  onAddHowWeMetTag={addHowWeMetTag}
                />
              ) : null}

              {/* Statistics screen */}
              {screen === SCREENS.stats ? (
                <Suspense
                  fallback={
                    <div role="status" className="flex h-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" style={{ color: palette.accent }} />
                    </div>
                  }
                >
                  <StatsScreen
                    people={people}
                    t={t}
                    language={language}
                    includePartnerEvents={includePartnerEvents}
                    setIncludePartnerEvents={setIncludePartnerEvents}
                    modalBackRef={modalBackRef}
                  />
                </Suspense>
              ) : null}
            </motion.div>

            {/* Bottom navigation */}
            {!hideBottomBar ? <BottomNav screen={screen} onNavigate={navigateTo} t={t} /> : null}
          </div>
        </div>
        {/* Full-screen overlays rendered outside the masked scroll area */}
        {screen === SCREENS.onboarding ? (
          <OnboardingWizard
            t={t}
            language={language}
            settings={{ theme, iconColor, statsVisible, includePartnerEvents }}
            onComplete={handleOnboardingComplete}
          />
        ) : null}
        {screen === SCREENS.intro ? (
          <IntroScreen
            onOpenMain={() => navigateTo(onboardingPending ? 'onboarding' : 'main')}
            showEntryGuide={onboardingPending}
            t={t}
          />
        ) : null}
        <AnimatePresence>{isPrivate && <PrivacyScreen key="privacy" />}</AnimatePresence>
      </CopyProvider>
    </ThemeProvider >
  )
}
