import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, BarChart3, UserPlus } from "lucide-react";
import { App as CapacitorApp } from "@capacitor/app";

import { PALETTES, TEXT, COPY } from "@/lib/constants";
import { ThemeProvider } from "@/lib/theme";
import { setAppIconColor } from "@/plugins/appicon";
import { todayString } from "@/lib/date";
import { uid, normalizePeople, mergeEventTagsFromPeople } from "@/lib/helpers";
import { hasScore } from "@/lib/format";
import {
  loadPeopleFromDevice,
  savePeopleToDevice,
  clearPeopleFromDevice,
  loadSettings,
  saveSettings,
} from "@/lib/device-storage";

import PeopleManagerScreen from "@/components/people/PeopleManagerScreen";
import HomeScreen from "./components/app/HomeScreen";
import AddPersonScreen from "./components/app/AddPersonScreen";
import IntroScreen from "./components/app/IntroScreen";
import StatsScreen from "@/components/stats/StatsScreen";

/**
 * Main app container.
 * It manages global app state, persistence, navigation, and data mutations.
 */
export default function KissRecorderApp() {
  // Main people dataset used across the whole app.
  const [people, setPeople] = useState([]);

  // Current visible screen.
  const [screen, setScreen] = useState("intro");

  // Navigation history stack for hardware back button support.
  const screenHistoryRef = useRef([]);

  // When a modal/sheet is open it registers a close callback here.
  // The back button handler checks this before doing screen navigation.
  const modalBackRef = useRef(null);
  // Ref keeps the latest screen value accessible inside the Capacitor listener.
  const screenRef = useRef("intro");

  // Current UI language.
  const [language, setLanguage] = useState("en");

  // Icon color palette selected by the user.
  const [iconColor, setIconColor] = useState("yellow");

  // Active UI theme.
  const [theme, setTheme] = useState("pink");

  // Whether the stats tiles on the home screen are visible.
  const [statsVisible, setStatsVisible] = useState(true);

  // User-defined situation tags shared across all event forms.
  const [situationTags, setSituationTags] = useState([]);

  // User-defined place tags shared across all event forms.
  const [placeTags, setPlaceTags] = useState([]);

  // Prevents saving before the initial load completes.
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep screenRef in sync so the Capacitor listener always sees the latest value.
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [screen]);

  /**
   * Navigates forward to a new screen and pushes the current one onto the history stack.
   */
  function navigateTo(newScreen) {
    screenHistoryRef.current = [...screenHistoryRef.current, screenRef.current];
    setScreen(newScreen);
  }

  /**
   * Handles the hardware back button.
   * From the "add" screen always returns to "intro" (privacy rule).
   * From "intro" exits the app.
   * From any other screen pops the history stack.
   */
  useEffect(() => {
    const listenerPromise = CapacitorApp.addListener("backButton", () => {
      if (modalBackRef.current) {
        modalBackRef.current();
        return;
      }

      const current = screenRef.current;

      if (current === "add") {
        screenHistoryRef.current = [];
        setScreen("intro");
      } else if (current === "intro") {
        CapacitorApp.exitApp();
      } else {
        const history = screenHistoryRef.current;
        if (history.length > 0) {
          const prev = history[history.length - 1];
          screenHistoryRef.current = history.slice(0, -1);
          setScreen(prev);
        } else {
          setScreen("intro");
        }
      }
    });

    return () => {
      listenerPromise.then((h) => h.remove());
    };
  }, []);

  /**
   * Bootstraps persisted app data on first render.
   * It loads saved people and the saved language if available.
   */
  useEffect(() => {
    let isMounted = true;

    async function boot() {
      try {
        // Load stored people from device or browser storage.
        const rawPeople = await loadPeopleFromDevice();
        if (!isMounted) return;

        // Normalize loaded data before storing it in state.
        const loadedPeople = normalizePeople(rawPeople);
        setPeople(loadedPeople);

        // Restore saved settings (language + icon color).
        const settings = await loadSettings();
        if (isMounted) {
          if (settings.language === "en" || settings.language === "es") setLanguage(settings.language);
          if (["yellow", "blue", "pink", "purple"].includes(settings.iconColor)) setIconColor(settings.iconColor);
          if (["pink", "green", "dark"].includes(settings.theme)) setTheme(settings.theme);
          setStatsVisible(settings.statsVisible);

          const savedTags = Array.isArray(settings.situationTags) ? settings.situationTags : [];
          setSituationTags(mergeEventTagsFromPeople(loadedPeople, savedTags, "situation"));

          const savedPlaceTags = Array.isArray(settings.placeTags) ? settings.placeTags : [];
          setPlaceTags(mergeEventTagsFromPeople(loadedPeople, savedPlaceTags, "place"));
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error("Failed to load app data", error);

        // Fallback to an empty dataset if loading fails.
        if (isMounted) setPeople([]);
      } finally {
        // Mark app as loaded only if the component is still mounted.
        if (isMounted) setIsLoaded(true);
      }
    }

    boot();

    // Prevent state updates if the component unmounts mid-load.
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Persists people data after the initial load is complete.
   * This avoids overwriting stored data during boot.
   */
  useEffect(() => {
    if (!isLoaded) return;

    savePeopleToDevice(people).catch((error) => {
      if (import.meta.env.DEV) console.error("Failed to save people file", error);
    });
  }, [people, isLoaded]);

  // Persists settings whenever language, iconColor, theme, statsVisible, situationTags or placeTags change (after boot).
  useEffect(() => {
    if (!isLoaded) return;
    saveSettings({ iconColor, language, theme, statsVisible, situationTags, placeTags }).catch((error) => {
      if (import.meta.env.DEV) console.error("Failed to save settings", error);
    });
  }, [iconColor, language, theme, statsVisible, situationTags, placeTags, isLoaded]);

  // Applies the dark class to <html> so shadcn portal components also get dark styles.
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Switches the icon from user actions only, because Android may kill the app while changing aliases.
  async function changeIconColor(newColor) {
    setIconColor(newColor);
    await saveSettings({ iconColor: newColor, language, theme });
    setAppIconColor(newColor);
  }

  async function changeTheme(newTheme) {
    setTheme(newTheme);
    await saveSettings({ iconColor, language, theme: newTheme });
  }

  // Active translation dictionary.
  const t = COPY[language];

  // Adds a new situation tag if it doesn't already exist.
  function addSituationTag(tag) {
    setSituationTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  }

  // Adds a new place tag if it doesn't already exist.
  function addPlaceTag(tag) {
    setPlaceTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  }

  // Clears all app data and resets the app to its initial state.
  async function clearAllAppData() {
    try {
      await clearPeopleFromDevice();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to clear app data", error);
    }

    setPeople([]);
    screenHistoryRef.current = [];
    setScreen("intro");
  }

  // Appends imported people (already deduplicated by the caller) to the existing dataset.
  function importAppData(rawPeople) {
    setPeople((prev) => [...prev, ...normalizePeople(rawPeople)]);
  }

  // Creates a new person and inserts an initial empty event.
  function addPerson(values) {
    const newPerson = {
      id: uid(),
      ...values,
      howWeMet: values.howWeMet || "",
      events: [
        {
          id: uid(),
          date: todayString(),
          details: "",
          score: null,
        },
      ],
    };

    setPeople((prev) => [newPerson, ...prev]);

    // Return to the entry screen after saving.
    screenHistoryRef.current = [];
    setScreen("intro");
  }

  // Updates a person's main profile fields.
  function updatePerson(personId, values) {
    setPeople((prev) =>
      prev.map((person) =>
        person.id === personId ? { ...person, ...values } : person,
      ),
    );
  }

  // Deletes a person completely from the dataset.
  function deletePerson(personId) {
    setPeople((prev) => prev.filter((person) => person.id !== personId));
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
          : person,
      ),
    );
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
                  : event,
              ),
            }
          : person,
      ),
    );
  }

  // Deletes one event from a person.
  function deleteEvent(personId, eventId) {
    setPeople((prev) =>
      prev.map((person) =>
        person.id === personId
          ? {
              ...person,
              events: (person.events || []).filter(
                (event) => event.id !== eventId,
              ),
            }
          : person,
      ),
    );
  }

  // Deletes all events for a person while preserving the person record.
  function deleteAllEvents(personId) {
    setPeople((prev) =>
      prev.map((person) =>
        person.id === personId ? { ...person, events: [] } : person,
      ),
    );
  }

  // Bottom navigation configuration.
  const navItems = [
    { key: "main", label: t.home, icon: Users },
    { key: "add", label: t.add, icon: UserPlus },
    { key: "people", label: t.people, icon: Search },
    { key: "stats", label: t.stats, icon: BarChart3 },
  ];

  // Hide bottom navigation on screens that use a focused layout.
  const hideBottomBar = screen === "add" || screen === "intro";

  const palette = PALETTES[theme] ?? PALETTES.pink;

  return (
    <ThemeProvider theme={theme}>
    <div
      style={{
        height: "100vh",
        color: palette.text,
        background: `linear-gradient(180deg, ${palette.bgGradientFrom}, ${palette.bgSoft}, ${palette.gradientEnd})`,
      }}
    >
      <div style={{ margin: "0 auto", display: "flex", height: "100%", width: "100%", maxWidth: "28rem", flexDirection: "column", paddingLeft: "1rem", paddingRight: "1rem" }}>
        {/* Main animated content area */}
        <motion.div
          ref={scrollRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{ flex: "1 1 0%", overflowY: "scroll", paddingTop: "1.25rem", paddingBottom: "5rem", WebkitOverflowScrolling: "touch" }}
        >
          {/* Entry screen */}
          {screen === "intro" ? (
            <IntroScreen onOpenMain={() => navigateTo("main")} t={t} />
          ) : null}

          {/* Main dashboard */}
          {screen === "main" ? (
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
            />
          ) : null}

          {/* Add person flow */}
          {screen === "add" ? (
            <AddPersonScreen
              onSave={addPerson}
              onBack={() => setScreen("intro")}
              t={t}
              language={language}
            />
          ) : null}

          {/* People management screen */}
          {screen === "people" ? (
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
            />
          ) : null}

          {/* Statistics screen */}
          {screen === "stats" ? <StatsScreen people={people} t={t} /> : null}
        </motion.div>

        {/* Bottom navigation */}
        {!hideBottomBar ? (
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              backdropFilter: "blur(8px)",
              borderTop: `1px solid ${palette.inputBorder}`,
              backgroundColor: palette.navBarBg,
            }}
          >
            <div style={{ margin: "0 auto", display: "grid", maxWidth: "28rem", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "0.25rem", paddingLeft: "0.75rem", paddingRight: "0.75rem", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = screen === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => navigateTo(item.key)}
                    className="rounded-2xl"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.25rem",
                      paddingLeft: "0.5rem",
                      paddingRight: "0.5rem",
                      paddingTop: "0.5rem",
                      paddingBottom: "0.5rem",
                      ...TEXT.caption,
                      fontWeight: "500",
                      transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                      background: active
                        ? `linear-gradient(90deg, ${palette.accent}, ${palette.accentSoft})`
                        : "transparent",
                      color: active ? "#ffffff" : palette.textSoft,
                    }}
                  >
                    <Icon style={{ height: "1rem", width: "1rem" }} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

      </div>
    </div>
    </ThemeProvider>
  );
}
