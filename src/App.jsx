import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, BarChart3, UserPlus } from "lucide-react";
import { App as CapacitorApp } from "@capacitor/app";

import { PALETTE, COPY } from "@/lib/constants";
import { setAppIconColor } from "@/plugins/appicon";
import { todayString } from "@/lib/date";
import { uid, normalizePeople } from "@/lib/helpers";
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
  // Ref keeps the latest screen value accessible inside the Capacitor listener.
  const screenRef = useRef("intro");

  // Current UI language.
  const [language, setLanguage] = useState("en");

  // Icon color palette selected by the user.
  const [iconColor, setIconColor] = useState("yellow");

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
        setPeople(normalizePeople(rawPeople));

        // Restore saved settings (language + icon color).
        const settings = await loadSettings();
        if (isMounted) {
          if (settings.language === "en" || settings.language === "es") setLanguage(settings.language);
          if (["yellow", "blue", "pink", "purple"].includes(settings.iconColor)) setIconColor(settings.iconColor);
        }
      } catch (error) {
        console.error("Failed to load app data", error);

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

    savePeopleToDevice(people).catch((error) =>
      console.error("Failed to save people file", error),
    );
  }, [people, isLoaded]);

  // Persists settings whenever language or iconColor change (after boot).
  useEffect(() => {
    if (!isLoaded) return;
    saveSettings({ iconColor, language }).catch(console.error);
  }, [iconColor, language, isLoaded]);

  // Switches the icon AND persists the color. Only call from user interaction,
  // never during boot — disabling the active alias kills the running process.
  // saveSettings is awaited so the file is written before Android kills the process.
  async function changeIconColor(newColor) {
    setIconColor(newColor);
    await saveSettings({ iconColor: newColor, language });
    setAppIconColor(newColor);
  }

  // Active translation dictionary.
  const t = COPY[language];

  /**
   * Clears all app data and resets the app to its initial state.
   */
  async function clearAllAppData() {
    try {
      // Remove persisted people data.
      await clearPeopleFromDevice();

      // Reset settings to defaults.
      await saveSettings({ iconColor: "yellow", language: "en" });
    } catch (error) {
      console.error("Failed to clear app data", error);
    }

    // Reset in-memory state.
    setPeople([]);
    setLanguage("en");
    screenHistoryRef.current = [];
    setScreen("intro");
  }

  /**
   * Creates a new person and inserts an initial empty event.
   */
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

  /**
   * Updates a person's main profile fields.
   */
  function updatePerson(personId, values) {
    setPeople((prev) =>
      prev.map((person) =>
        person.id === personId ? { ...person, ...values } : person,
      ),
    );
  }

  /**
   * Deletes a person completely from the dataset.
   */
  function deletePerson(personId) {
    setPeople((prev) => prev.filter((person) => person.id !== personId));
  }

  /**
   * Adds a new event to a person.
   * Invalid scores are normalized to null.
   */
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

  /**
   * Updates a specific event for a person.
   * Invalid scores are normalized to null.
   */
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

  /**
   * Deletes one event from a person.
   */
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

  /**
   * Deletes all events for a person while preserving the person record.
   */
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

  return (
    <div
      className="h-screen text-slate-900"
      style={{
        background: `linear-gradient(180deg, ${PALETTE.bgGradientFrom}, ${PALETTE.bgSoft}, ${PALETTE.sky})`,
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-4">
        {/* Main animated content area */}
        <motion.div
          ref={scrollRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-y-scroll pt-5 pb-20"
          style={{ WebkitOverflowScrolling: "touch" }}
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
              people={people}
              t={t}
              language={language}
              setLanguage={setLanguage}
              iconColor={iconColor}
              setIconColor={changeIconColor}
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
            />
          ) : null}

          {/* Statistics screen */}
          {screen === "stats" ? <StatsScreen people={people} t={t} /> : null}
        </motion.div>

        {/* Bottom navigation */}
        {!hideBottomBar ? (
          <div
            className="fixed bottom-0 left-0 right-0 backdrop-blur"
            style={{
              borderTop: "1px solid #ecd6e0",
              backgroundColor: "rgba(255,255,255,0.8)",
            }}
          >
            <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-3 py-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = screen === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => navigateTo(item.key)}
                    className="flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium transition"
                    style={{
                      background: active
                        ? `linear-gradient(90deg, ${PALETTE.rose}, ${PALETTE.roseSoft})`
                        : "transparent",
                      color: active ? "#ffffff" : PALETTE.textSoft,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}