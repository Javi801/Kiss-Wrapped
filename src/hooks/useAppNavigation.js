import { useEffect, useRef, useState } from 'react'
import { App as CapacitorApp } from '@capacitor/app'

/**
 * Owns the visible screen, its history stack, and the hardware back button.
 */
export function useAppNavigation() {
  // Current visible screen. Boot starts blank until persisted settings are read.
  const [screen, setScreen] = useState('boot')

  // Navigation history stack for hardware back button support.
  const screenHistoryRef = useRef([])

  // When a modal/sheet is open it registers a close callback here.
  // The back button handler checks this before doing screen navigation.
  const modalBackRef = useRef(null)
  // Ref keeps the latest screen value accessible inside the Capacitor listener.
  const screenRef = useRef('boot')

  // Keep screenRef in sync so the Capacitor listener always sees the latest value.
  useEffect(() => {
    screenRef.current = screen
  }, [screen])

  /**
   * Navigates forward to a new screen and pushes the current one onto the history stack.
   */
  function navigateTo(newScreen) {
    screenHistoryRef.current = [...screenHistoryRef.current, screenRef.current]
    setScreen(newScreen)
  }

  // Jumps to a screen and drops the history stack.
  function resetTo(newScreen) {
    screenHistoryRef.current = []
    setScreen(newScreen)
  }

  /**
   * Handles the hardware back button.
   * From the "add" screen always returns to "intro" (privacy rule).
   * From "intro" exits the app.
   * From any other screen pops the history stack.
   */
  useEffect(() => {
    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      if (modalBackRef.current) {
        modalBackRef.current()
        return
      }

      const current = screenRef.current

      if (current === 'add') {
        screenHistoryRef.current = []
        setScreen('intro')
      } else if (current === 'intro') {
        CapacitorApp.exitApp()
      } else {
        const history = screenHistoryRef.current
        if (history.length > 0) {
          const prev = history[history.length - 1]
          screenHistoryRef.current = history.slice(0, -1)
          setScreen(prev)
        } else if (current === 'main') {
          CapacitorApp.exitApp()
        } else {
          setScreen('main')
        }
      }
    })

    return () => {
      listenerPromise.then((h) => h.remove())
    }
  }, [])

  return { screen, setScreen, navigateTo, resetTo, modalBackRef }
}
