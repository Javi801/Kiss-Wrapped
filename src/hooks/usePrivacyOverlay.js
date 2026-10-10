import { useEffect, useState } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

/**
 * Returns true while the app is backgrounded, which triggers the privacy overlay.
 */
export function usePrivacyOverlay() {
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    const hide = () => setIsPrivate(true)

    if (Capacitor.isNativePlatform()) {
      // pause fires early (before the app-switcher screenshot) and is reliable for showing.
      // resume fires spuriously on EMUI ~1s after pause even while still in the switcher,
      // so we ignore it and only restore via appStateChange which fires on true foreground.
      document.addEventListener('pause', hide)
      const capListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) setIsPrivate(false)
      })
      return () => {
        document.removeEventListener('pause', hide)
        capListener.then((h) => h.remove())
      }
    }

    // Web / browser dev: visibilitychange is the only option
    const handleVisibility = () => setIsPrivate(document.hidden)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return isPrivate
}
