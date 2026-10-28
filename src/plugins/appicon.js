import { registerPlugin } from '@capacitor/core'

const AppIcon = registerPlugin('AppIcon')

// Switches the Android and iOS launcher icon to the given color variant, no-oping on web.
export async function setAppIconColor(color) {
  try {
    await AppIcon.setColor({ color })
  } catch {
    // Plugin is unavailable on web, so this can be ignored.
  }
}
