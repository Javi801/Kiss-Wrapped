import React, { Suspense, lazy, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, BarChart3, UserPlus, Loader2 } from 'lucide-react'

import { PALETTES, TEXT, COPY } from '@/lib/constants'
import { ThemeProvider } from '@/lib/theme'
import { CopyProvider } from '@/lib/copy'
import { setAppIconColor } from '@/plugins/appicon'
import { todayString } from '@/lib/date'
import {
  uid,
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
import OnboardingScreen from './components/app/OnboardingScreen'
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

  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [screen])

  // Fetches the stats chunk after the first render so opening the screen does not wait for it.
  useEffect(() => {
    loadStatsScreen().catch(() => {})
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
    resetTo('intro')
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
    const newPerson = {
      id: uid(),
      ...values,
      realName: values.realName || '',
      howWeMet: values.howWeMet || '',
      events: [
        {
          id: uid(),
          date: todayString(),
          details: '',
          score: null,
        },
      ],
    }

    setPeople((prev) => [newPerson, ...prev])
    registerHowWeMetTags([newPerson])

    // Return to the entry screen after saving.
    resetTo('intro')
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
   * Called when the user finishes or skips the onboarding flow.
   * Marks onboarding as done (triggers the save effect) and goes to the intro screen.
   */
  function handleOnboardingComplete() {
    completeOnboarding()
    resetTo('intro')
  }

  // Bottom navigation configuration.
  const navItems = [
    { key: 'main', label: t.home, icon: Users },
    { key: 'add', label: t.add, icon: UserPlus },
    { key: 'people', label: t.people, icon: Search },
    { key: 'stats', label: t.stats, icon: BarChart3 },
  ]

  // Hide bottom navigation on screens that use a focused layout.
  const hideBottomBar =
    screen === 'boot' || screen === 'add' || screen === 'intro' || screen === 'onboarding'

  const palette = PALETTES[theme] ?? PALETTES.pink

  return (
    <ThemeProvider theme={theme}>
      <CopyProvider language={language}>
        <div
          style={{
            height: '100vh',
            color: palette.text,
            background: `linear-gradient(180deg, ${palette.bgGradientFrom}, ${palette.bgSoft}, ${palette.gradientEnd})`,
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
              {screen === 'main' ? (
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
                />
              ) : null}

              {/* Add person flow */}
              {screen === 'add' ? (
                <AddPersonScreen
                  onSave={addPerson}
                  onBack={() => setScreen('intro')}
                  t={t}
                  language={language}
                />
              ) : null}

              {/* People management screen */}
              {screen === 'people' ? (
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
              {screen === 'stats' ? (
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
            {!hideBottomBar ? (
              <div
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  backdropFilter: 'blur(8px)',
                  borderTop: `1px solid ${palette.inputBorder}`,
                  backgroundColor: palette.navBarBg,
                }}
              >
                <div
                  style={{
                    margin: '0 auto',
                    display: 'grid',
                    maxWidth: '28rem',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: '0.25rem',
                    paddingLeft: '0.75rem',
                    paddingRight: '0.75rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                  }}
                >
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const active = screen === item.key

                    return (
                      <button
                        key={item.key}
                        onClick={() => navigateTo(item.key)}
                        className="rounded-2xl"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                          paddingLeft: '0.5rem',
                          paddingRight: '0.5rem',
                          paddingTop: '0.5rem',
                          paddingBottom: '0.5rem',
                          ...TEXT.caption,
                          fontWeight: '500',
                          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                          background: active
                            ? `linear-gradient(90deg, ${palette.accent}, ${palette.accentSoft})`
                            : 'transparent',
                          color: active ? '#ffffff' : palette.textSoft,
                        }}
                      >
                        <Icon style={{ height: '1rem', width: '1rem' }} />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {/* Full-screen overlays rendered outside the masked scroll area */}
        {screen === 'onboarding' ? (
          <OnboardingScreen t={t} onComplete={handleOnboardingComplete} />
        ) : null}
        {screen === 'intro' ? <IntroScreen onOpenMain={() => navigateTo('main')} t={t} /> : null}
        <AnimatePresence>{isPrivate && <PrivacyScreen key="privacy" />}</AnimatePresence>
      </CopyProvider>
    </ThemeProvider>
  )
}
