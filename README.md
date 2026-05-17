# Kiss Recorder

![status](https://img.shields.io/badge/status-stable-green)
![license](https://img.shields.io/badge/license-MIT-blue)

A lightweight personal tracking web app to log interactions ("events") with people, analyze patterns, and visualize statistics over time. Built with React, Tailwind CSS and packaged with Capacitor for mobile support.

<!-- toc -->
## Table of Contents

- [Features](#features)
- [Download](#download)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Install](#install)
  - [Development](#development)
  - [Build](#build)
- [Testing](#testing)
  - [Running tests](#running-tests)
  - [Coverage](#coverage)
  - [What is tested](#what-is-tested)
- [Capacitor / Mobile (Android)](#capacitor--mobile-android)
  - [iOS notes and permissions](#ios-notes-and-permissions)
- [Data Model](#data-model)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- **People management:** add, edit, delete people with attributes — name, birth year, zodiac sign, gender, activity, how you met
- **Event tracking:** log events with date, free-text details and an optional 1–5 score; edit or delete at any time
- **Analytics dashboard** with four tabs:
  - *Overview* — summary tiles and top-person highlights
  - *Time* — heatmap, area charts and monthly/yearly breakdowns
  - *People* — distributions by zodiac, gender, activity and age; age range boxplot with optional year split
  - *Scores* — score distribution, dumbbell chart and average trends
- **Zodiac-based age calculation:** age is derived from birth year and zodiac sign end date, so it increments on the zodiac birthday rather than a fixed calendar date
- **Age-at-event charts:** the "People by age" and "Age range" charts can switch between current age and the age each person had at the time of their events
- **PDF export** of the full stats dashboard
- **Theme support:** light, green and dark palettes, with UI colors driven by shared palette tokens and persisted theme selection
- **Localization:** English and Spanish
- **Local persistence** via browser/device storage (no backend required)

## Download

The first stable release is available from the GitHub Releases page.

Android users can download the APK from the latest release and install it manually. Because the app is not distributed through Google Play yet, Android may show a warning before installation.

### Android APK

To install the app on Android:

1. Download the `.apk` file from the latest GitHub release.
2. Open it on your Android device.
3. Allow installation from unknown sources if Android prompts you.
4. Follow the Android installation steps.

Note: KissRecorder is currently distributed manually and is not yet available on Google Play.

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI framework |
| Vite | 8 | Build tool and dev server |
| Tailwind CSS | 4 | Utility-first styling |
| Custom theme context | n/a | Shared palette access for light, green and dark themes |
| shadcn/ui + Radix UI | latest | Accessible UI primitives |
| Recharts | 3 | Charts (bar, pie, radar, area, heatmap) |
| Framer Motion | 12 | Animations |
| Lucide React | latest | Icons |
| jsPDF | 4 | PDF export |
| Capacitor | 8 | Native mobile packaging (Android) |

## Project Structure

```
src/
├── components/
│   ├── app/          # Top-level screens (Home, AddPerson, Intro, Language)
│   ├── charts/       # Generic reusable chart cards (Bar, Pie, Radar, Area, Heatmap, Dumbbell)
│   ├── forms/        # PersonForm, EventForm, FiltersPanel
│   ├── people/       # People list and empty state
│   ├── person/       # PersonCard
│   ├── shared/       # StatTile, TileCard, TopPersonTile, SettingsTile
│   ├── stats/        # Stats screen and its four tab components + AgeRangeCard
│   ├── ui/           # shadcn/ui primitives (Button, Card, Dialog, Input…)
│   └── visuals/      # Decorative background components
├── lib/
│   ├── calendar.js        # Calendar grid and date navigation helpers
│   ├── constants.js       # PALETTE, TEXT, CHART_COLORS, translations (EN/ES)
│   ├── theme.jsx          # Theme context and palette hook used across the UI
│   ├── date.js            # Date validation, formatting, zodiac age calculation
│   ├── device-storage.js  # Capacitor/localStorage persistence layer
│   ├── format.js          # Score rendering, label translations, zodiac helpers
│   ├── helpers.js         # ID generation, people normalization
│   ├── pdf-export.js      # jsPDF stats report generation
│   └── stats.js           # Pure aggregation functions used by the stats screen
├── App.jsx
└── main.jsx
scripts/
└── generate-icon.mjs      # Generates app icon assets
capacitor.config.json
```

## Getting Started

### Prerequisites

- Node.js (LTS) and npm
- For Android builds: Android Studio and Android SDK (Linux/Windows/macOS)

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser at the address shown by Vite (usually `http://localhost:5173`).

### Build

```bash
npm run build
```

Production output goes to `dist/`.

### Icon generation

```bash
npm run gen:icon
```

Regenerates app icon assets from the source image via `scripts/generate-icon.mjs`.

## Testing

The project uses [Vitest](https://vitest.dev/) with the V8 coverage provider.

### Running tests

```bash
# run all tests once
npm test

# watch mode (re-runs on file changes)
npm run test:watch

# generate coverage report
npm run test:coverage
```

### Coverage

Coverage is scoped to `src/lib/`. Minimum thresholds enforced by CI:

| Metric     | Threshold |
|------------|-----------|
| Statements | 95%       |
| Branches   | 90%       |
| Functions  | 95%       |
| Lines      | 95%       |

### What is tested

Unit tests live in `src/lib/__tests__/`:

| File              | What's covered |
|-------------------|----------------|
| `date.js`         | Date string validation, formatting, month/year/key extraction, zodiac date parsing, `calculateAge`, `calculateAgeAtEvent`, `deriveBirthYear` |
| `calendar.js`     | `parseCalendarDate`, `toCalendarDate`, `buildDayGrid`, `nextCalView` |
| `format.js`       | Score validation, kiss rendering, label translations, zodiac short labels, gender colors |
| `helpers.js`      | ID generation, people normalization, hex-to-RGB conversion |
| `stats.js`        | Event date helpers, all `getStatsData` aggregations |
| `constants.js`    | `abbreviateZodiacMonths` and related formatting helpers |
| `device-storage.js` | Storage read/write with mocked Capacitor/localStorage |

`pdf-export.js` is intentionally excluded (DOM + file system side effects).

## Capacitor / Mobile (Android)

The app is packaged with Capacitor 8. The web build output directory is `dist` as defined in `capacitor.config.json`.

```bash
# build web assets first
npm run build

# add the platform (only once)
npx cap add android

# sync web assets into the native project after web changes
npx cap sync android

# open in Android Studio
npx cap open android
```

For production builds, configure keystore signing in the Android project and declare any required permissions in `AndroidManifest.xml`.

### iOS notes and permissions

iOS builds require macOS and Xcode. If you add the iOS platform:

```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

If the app records audio, add a microphone usage description to `Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Kiss Recorder needs microphone access to record audio for events.</string>
```

Ensure the Bundle Identifier in Xcode matches a provisioning profile and a signing team is selected.

## Data Model

```js
Person {
  id:         string
  name:       string
  birthYear:  number          // used with zodiacSign to derive current age
  zodiacSign: string          // e.g. "Aries (March 21 - April 19)"
  gender:     string
  activity:   string
  howWeMet:   string
  events:     Event[]
}

Event {
  id:      string
  date:    string        // format: "yyyy.MM.dd"
  details: string
  score:   number | null // 1–5, or null if unrated
}
```

Age is never stored directly on the person. It is computed at runtime via `calculateAge(birthYear, zodiacSign)`, which increments when the zodiac sign's end date passes each year. `calculateAgeAtEvent(birthYear, zodiacSign, eventDate)` is used in charts that display age as of the moment of each event.

## Troubleshooting

- If the native build can't find web assets, confirm you ran `npm run build` and then `npx cap sync <platform>`.
- For iOS build issues, check signing settings and valid provisioning profiles in Xcode.
- If audio recording fails on a device, verify the microphone permission was granted at runtime.

## License

MIT
