/**
 * Central project configuration.
 * Feature flags, app metadata, supported options, defaults, and limits live here
 * so they are changed in one visible place instead of scattered literals.
 *
 * Storage keys and file names are a data contract, not configuration:
 * they stay in constants.js.
 */

import { version } from '../../package.json'

// Feature flags. Set to true to enable a feature.
export const FEATURES = {
  // Kiss Wrapped PDF deck export on the stats screen. Off until the export bug is fixed.
  pdfExport: false,
  // Onboarding tutorial: shown to new installs and restartable from the settings.
  onboarding: true,
}

// App metadata shown in the UI. The version has a single source: package.json.
export const APP_VERSION = version
export const APP_GITHUB_USER = 'Javi801'
export const APP_GITHUB_REPO = 'https://github.com/Javi801/Kiss-Wrapped'

// Supported values for user settings. Persisted values outside these lists are ignored.
export const LANGUAGES = ['en', 'es']
export const THEMES = ['pink', 'green', 'dark']
export const ICON_COLORS = ['yellow', 'blue', 'pink', 'purple']

// Initial values for user settings. They apply only until the user's own
// choice is persisted; a saved setting always takes priority over these.
export const DEFAULT_SETTINGS = {
  language: 'en',
  theme: 'pink',
  iconColor: 'yellow',
  statsVisible: true,
  includePartnerEvents: false,
}

// Input and display limits.
export const LIMITS = {
  // Person name and real name.
  nameLength: 100,
  // Tag-style fields: event place, event situation, how we met.
  tagLength: 200,
  // Person activity detail.
  personDetailLength: 500,
  // Event details and observations.
  eventNotesLength: 1000,
  maxAge: 120,
  // Entries in the "people with most events" ranking.
  topPeopleCount: 8,
}
