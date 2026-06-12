<h1 align="center">KissRecorder</h1>

<p align="center">
  A private, offline-first app to log your interactions, track patterns, and understand your social life. No account, no server, no cloud.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor">
</p>

<p align="center">
  <strong>Platforms</strong><br>
  <img src="https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android">
  <img src="https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=apple&logoColor=white" alt="iOS">
  <img src="https://img.shields.io/badge/EMUI-CF0A2C?style=for-the-badge&logo=huawei&logoColor=white" alt="EMUI">
</p>

<br>

<p align="center">
  <a href="https://github.com/Javi801/KissRecorder/releases">
    <img src="https://img.shields.io/badge/Version-1.1.0-6366f1?style=for-the-badge&logo=github" alt="Version 1.1.0">
  </a>
</p>

<br>

## Overview

KissRecorder is a cross-platform mobile tracker for logging events with the people in your life. You record who, when, where, and how it went, and the app turns that data into charts, patterns, and insights without sending a single byte to a server.

Everything lives on your device. There is no backend, no account, and no sync service. The app runs natively on Android, iOS, and EMUI via Capacitor.

> Built for people who want to understand their social patterns without trading their privacy for it.

At a glance:

- Fully offline, all data stays on device
- Cross-platform: Android, iOS, and EMUI
- People profiles with zodiac-aware age tracking
- Event log with place, situation, and optional score
- Rich analytics dashboard with fullscreen charts and PNG export
- KissWrapped PDF slide deck and JSON backup export

## Features

<table>
  <tr>
    <td width="50%" valign="top">
      <picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/feature-people-dark.svg"><img src="assets/readme/feature-people-light.svg" width="55" alt="People icon"></picture><br>
      <strong>People profiles</strong><br>
      Add people with name, optional real name, birth year, zodiac sign, gender, activity, and a tag-based <em>how we met</em> field. Age is computed at runtime from the zodiac calendar, not stored.<br><br>
      <code>Zodiac age</code> <code>Optional real name</code> <code>Tag input</code>
    </td>
    <td width="50%" valign="top">
      <picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/feature-events-dark.svg"><img src="assets/readme/feature-events-light.svg" width="55" alt="Events icon"></picture><br>
      <strong>Event log</strong><br>
      Record each interaction with a date, place, situation, and an optional score from 1 to 5. Events are tied to a person and editable or deletable at any time.<br><br>
      <code>Dated entries</code> <code>Place + situation tags</code> <code>Scores</code>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/feature-stats-dark.svg"><img src="assets/readme/feature-stats-light.svg" width="55" alt="Stats icon"></picture><br>
      <strong>Analytics dashboard</strong><br>
      Four stat tabs: Overview, Time, People, and Scores. Includes heatmaps, area charts, zodiac distributions, score dumbbells, and age-range boxplots. Any chart can be expanded to fullscreen and exported as a PNG.<br><br>
      <code>Heatmap</code> <code>Distributions</code> <code>Age at event</code> <code>Fullscreen</code> <code>PNG export</code>
    </td>
    <td width="50%" valign="top">
      <picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/feature-export-dark.svg"><img src="assets/readme/feature-export-light.svg" width="55" alt="Export icon"></picture><br>
      <strong>Export and share</strong><br>
      Export your data as a JSON backup or as a KissWrapped PDF slide deck — a landscape-format presentation with themed styling and slide numbers. Charts can be exported individually as PNG images. All sharing uses the device's native share sheet.<br><br>
      <code>JSON backup</code> <code>KissWrapped PDF</code> <code>Chart PNG</code> <code>Native share</code>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/feature-crash-dark.svg"><img src="assets/readme/feature-crash-light.svg" width="55" alt="Crash reporting icon"></picture><br>
      <strong>Crash reporting</strong><br>
      An ErrorBoundary wraps the entire app. If something crashes, the error is written to a local log file and the user can share it immediately via the native share sheet. Chart export failures are similarly caught, logged, and shareable.<br><br>
      <code>ErrorBoundary</code> <code>Local crash log</code> <code>Export error log</code> <code>Share to report</code>
    </td>
    <td width="50%" valign="top">
      <picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/feature-themes-dark.svg"><img src="assets/readme/feature-themes-light.svg" width="55" alt="Themes icon"></picture><br>
      <strong>Themes and localization</strong><br>
      Three color palettes: light, green, and dark, driven by shared tokens and persisted across sessions. UI available in English and Spanish.<br><br>
      <code>Light / Green / Dark</code> <code>EN / ES</code> <code>Persisted</code>
    </td>
  </tr>
</table>

## Screenshots

<p align="center">
  <img src="assets/readme/screenshots/ss-fake-main.jpg" alt="Privacy decoy screen" width="19%">
  <img src="assets/readme/screenshots/ss-main-pink-theme.jpg" alt="Home screen, pink theme" width="19%">
  <img src="assets/readme/screenshots/ss-main-green-theme.jpg" alt="Home screen, green theme" width="19%">
  <img src="assets/readme/screenshots/ss-main-dark-theme.jpg" alt="Home screen, dark theme" width="19%">
  <img src="assets/readme/screenshots/ss-config-selector.jpg" alt="Theme and icon color settings" width="19%">
</p>

<p align="center">
  <img src="assets/readme/screenshots/ss-new-person.png" alt="Add new person form" width="19%">
  <img src="assets/readme/screenshots/ss-people-list-.jpg" alt="People list with search" width="19%">
  <img src="assets/readme/screenshots/ss-people-list-filter.jpg" alt="Filter panel for the people list" width="19%">
  <img src="assets/readme/screenshots/ss-stats-overview.jpg" alt="Stats overview tab" width="19%">
  <img src="assets/readme/screenshots/ss-graphs.jpg" alt="Bar and radar charts" width="19%">
</p>

## Project structure

<table>
  <tr>
    <td><strong>Area</strong></td>
    <td><strong>Responsibility</strong></td>
  </tr>
  <tr>
    <td><code>App.jsx</code></td>
    <td>Application shell, screen routing, theme context, and settings initialization</td>
  </tr>
  <tr>
    <td><code>components/app/</code></td>
    <td>Top-level screens: Home, AddPerson, Intro, Language, Theme, Color selectors, ErrorBoundary, and PrivacyScreen</td>
  </tr>
  <tr>
    <td><code>components/stats/</code></td>
    <td>Stats screen and its four tab components: Overview, Time, People, Scores, plus AgeRangeCard</td>
  </tr>
  <tr>
    <td><code>components/forms/</code></td>
    <td>PersonForm, EventForm, FiltersPanel, and TagInput</td>
  </tr>
  <tr>
    <td><code>components/charts/</code></td>
    <td>Generic reusable chart cards: Bar, Pie, Radar, Area, Heatmap, Dumbbell. FullscreenChartWrapper and FullscreenContext enable fullscreen expansion and PNG export for any chart</td>
  </tr>
  <tr>
    <td><code>lib/</code></td>
    <td>Pure logic: date and zodiac helpers, stats aggregation, PDF export, device storage, theme context, and the cn utility</td>
  </tr>
  <tr>
    <td><code>plugins/</code></td>
    <td>Native Capacitor plugin helpers</td>
  </tr>
</table>

## Getting started

### Prerequisites

- Node.js LTS and npm
- Android builds: Android Studio and Android SDK
- iOS builds: macOS and Xcode
- EMUI builds: AppGallery Connect credentials

### Install and run

```bash
npm install
npm run dev
```

Open your browser at the address shown by Vite, usually `http://localhost:5173`.

### Build

```bash
npm run build
```

Production output goes to `dist/`.

### Android

```bash
npm run build
npx cap sync android
npx cap open android
```

Build and run from Android Studio on a device or emulator.

### iOS

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Requires macOS and Xcode. Set a valid Bundle Identifier and signing team before building.

### EMUI

EMUI support follows the same Capacitor build path as Android. Sideload the APK on Huawei devices or distribute through AppGallery. HMS Core services are not required since the app has no cloud dependencies.

## Testing

The project uses [Vitest](https://vitest.dev/) with the V8 coverage provider.

```bash
npm test                # run all tests once
npm run test:watch      # watch mode
npm run test:coverage   # generate coverage report
```

Coverage is scoped to `src/lib/` with these minimum thresholds enforced by CI:

| Metric | Threshold |
|--------|-----------|
| Statements | 95% |
| Branches | 90% |
| Functions | 95% |
| Lines | 95% |

Unit tests in `src/lib/__tests__/` cover: `date.js`, `calendar.js`, `format.js`, `helpers.js`, `stats.js`, `constants.js`, `device-storage.js`, `pdf-export.js`, and `utils.js`. `device-storage.js` and `utils.js` are excluded from threshold enforcement since they depend on native plugins or external APIs.

## Data model

```js
Person {
  id:         string
  name:       string
  realName:   string          // optional
  birthYear:  number
  zodiacSign: string          // e.g. "Aries"
  gender:     string
  activity:   string
  howWeMet:   string          // tag-based
  events:     Event[]
}

Event {
  id:        string
  date:      string           // "yyyy.MM.dd"
  place:     string
  situation: string
  score:     number | null    // 1 to 5, or null
}

Settings {
  language:         string    // en or es
  theme:            string    // light, green, or dark
  iconColor:        string
  statsVisible:     boolean
  situationTags:    string[]
  placeTags:        string[]
}
```

Age is computed at runtime via `calculateAge` and never stored on the person.

## Download

Releases are published on the [GitHub Releases page](https://github.com/Javi801/KissRecorder/releases).

| Platform | How to install |
|----------|---------------|
| **Android** | Download the `.apk` and sideload it. Allow installation from unknown sources if prompted. Not on Google Play yet. |
| **iOS** | Build from source via Xcode or wait for a TestFlight link. Not on the App Store yet. |
| **EMUI** | Download the `.apk` and sideload it on your Huawei device. No HMS dependencies required. Not on AppGallery yet. |

## License

MIT
