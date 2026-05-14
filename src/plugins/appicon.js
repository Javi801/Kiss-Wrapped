import { registerPlugin } from '@capacitor/core'

const AppIcon = registerPlugin('AppIcon')

// Switches the Android launcher icon to the given color variant, no-oping on web and iOS.
export async function setAppIconColor(color) {
  try {
    await AppIcon.setColor({ color })
  } catch {
    // Plugin is unavailable on web and iOS, so this can be ignored.
  }
}
