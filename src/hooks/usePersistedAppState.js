import { useEffect, useState } from 'react'

import { detectDeviceLanguage } from '@/lib/constants'
import {
  FEATURES,
  ONBOARDING_VERSION,
  LANGUAGES,
  THEMES,
  ICON_COLORS,
  DEFAULT_SETTINGS,
} from '@/lib/config'
import { normalizePeople, mergeEventTagsFromPeople, mergePeopleFieldTags } from '@/lib/helpers'
import {
  loadPeopleFromDevice,
  savePeopleToDevice,
  loadSettings,
  saveSettings,
} from '@/lib/device-storage'

/**
 * Owns the persisted app state: the people dataset and the user settings.
 * It loads both on first render, picks the first screen through `setScreen`,
 * and saves every later change.
 */
export function usePersistedAppState(setScreen) {
  // Main people dataset used across the whole app.
  const [people, setPeople] = useState([])

  // Current UI language.
  const [language, setLanguage] = useState(DEFAULT_SETTINGS.language)

  // Icon color palette selected by the user.
  const [iconColor, setIconColor] = useState(DEFAULT_SETTINGS.iconColor)

  // Active UI theme.
  const [theme, setTheme] = useState(DEFAULT_SETTINGS.theme)

  // Whether the stats tiles on the home screen are visible.
  const [statsVisible, setStatsVisible] = useState(DEFAULT_SETTINGS.statsVisible)

  // Whether events inside a partner period count in event-based statistics.
  const [includePartnerEvents, setIncludePartnerEvents] = useState(
    DEFAULT_SETTINGS.includePartnerEvents
  )

  // User-defined situation tags shared across all event forms.
  const [situationTags, setSituationTags] = useState([])

  // User-defined place tags shared across all event forms.
  const [placeTags, setPlaceTags] = useState([])

  // User-defined how-we-met tags shared across all person forms.
  const [howWeMetTags, setHowWeMetTags] = useState([])

  // Whether the onboarding flow has been completed (true = skip, show app normally).
  // Initialized to true to avoid flashing the onboarding on re-renders; boot corrects it.
  const [onboardingDone, setOnboardingDone] = useState(true)
  const [onboardingVersion, setOnboardingVersion] = useState(ONBOARDING_VERSION)

  // Prevents saving before the initial load completes.
  const [isLoaded, setIsLoaded] = useState(false)

  /**
   * Bootstraps persisted app data on first render.
   * It loads saved people and the saved settings if available.
   */
  useEffect(() => {
    let isMounted = true

    async function boot() {
      try {
        // Load stored people from device or browser storage.
        const rawPeople = await loadPeopleFromDevice()
        if (!isMounted) return

        // Normalize loaded data before storing it in state.
        const loadedPeople = normalizePeople(rawPeople)
        setPeople(loadedPeople)

        // Restore saved settings (language + icon color).
        const settings = await loadSettings()
        if (isMounted) {
          if (LANGUAGES.includes(settings.language)) setLanguage(settings.language)

          const needsOnboarding =
            FEATURES.onboarding &&
            (!settings.onboardingDone || settings.onboardingVersion !== ONBOARDING_VERSION)
          if (needsOnboarding) {
            // First launch or updated tutorial: show onboarding.
            if (!settings.onboardingDone) setLanguage(detectDeviceLanguage())
            setOnboardingDone(false)
            setOnboardingVersion(settings.onboardingVersion || 0)
            setScreen('onboarding')
          } else {
            setOnboardingDone(true)
            setOnboardingVersion(settings.onboardingVersion)
            setScreen('intro')
          }

          if (ICON_COLORS.includes(settings.iconColor)) setIconColor(settings.iconColor)
          if (THEMES.includes(settings.theme)) setTheme(settings.theme)
          setStatsVisible(settings.statsVisible)
          setIncludePartnerEvents(settings.includePartnerEvents === true)

          const savedTags = Array.isArray(settings.situationTags) ? settings.situationTags : []
          setSituationTags(mergeEventTagsFromPeople(loadedPeople, savedTags, 'situation'))

          const savedPlaceTags = Array.isArray(settings.placeTags) ? settings.placeTags : []
          setPlaceTags(mergeEventTagsFromPeople(loadedPeople, savedPlaceTags, 'place'))

          const savedHowWeMetTags = Array.isArray(settings.howWeMetTags)
            ? settings.howWeMetTags
            : []
          setHowWeMetTags(mergePeopleFieldTags(loadedPeople, savedHowWeMetTags, 'howWeMet'))
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to load app data', error)

        // Fallback to an empty dataset if loading fails.
        if (isMounted) {
          setPeople([])
          setOnboardingDone(false)
          setOnboardingVersion(0)
          setLanguage(detectDeviceLanguage())
          setScreen(FEATURES.onboarding ? 'onboarding' : 'intro')
        }
      } finally {
        // Mark app as loaded only if the component is still mounted.
        if (isMounted) setIsLoaded(true)
      }
    }

    boot()

    // Prevent state updates if the component unmounts mid-load.
    return () => {
      isMounted = false
    }
  }, [setScreen])

  /**
   * Persists people data after the initial load is complete.
   * This avoids overwriting stored data during boot.
   */
  useEffect(() => {
    if (!isLoaded) return

    savePeopleToDevice(people).catch((error) => {
      if (import.meta.env.DEV) console.error('Failed to save people file', error)
    })
  }, [people, isLoaded])

  // Persists settings whenever language, iconColor, theme, statsVisible, includePartnerEvents, situationTags, placeTags or onboardingDone change (after boot).
  useEffect(() => {
    if (!isLoaded) return
    saveSettings({
      iconColor,
      language,
      theme,
      statsVisible,
      includePartnerEvents,
      situationTags,
      placeTags,
      howWeMetTags,
      onboardingDone,
      onboardingVersion,
    }).catch((error) => {
      if (import.meta.env.DEV) console.error('Failed to save settings', error)
    })
  }, [
    iconColor,
    language,
    theme,
    statsVisible,
    includePartnerEvents,
    situationTags,
    placeTags,
    howWeMetTags,
    onboardingDone,
    onboardingVersion,
    isLoaded,
  ])

  // Marks the current onboarding version as done (triggers the save effect).
  function completeOnboarding() {
    setOnboardingDone(true)
    setOnboardingVersion(ONBOARDING_VERSION)
  }

  return {
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
  }
}
