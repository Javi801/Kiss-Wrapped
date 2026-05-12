# Kiss Recorder

![build status](https://img.shields.io/badge/status-development-yellow)
![license](https://img.shields.io/badge/license-MIT-blue)

A lightweight personal tracking web app to log interactions ("events") with people, analyze patterns, and visualize statistics over time. Built with React, Tailwind CSS and packaged with Capacitor for mobile support.

<!-- toc -->
## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Install](#install)
  - [Development](#development)
  - [Build](#build)
- [Capacitor / Mobile (iOS & Android)](#capacitor--mobile-ios--android)
  - [iOS notes and permissions](#ios-notes-and-permissions)
  - [Android notes](#android-notes)
- [Data Model](#data-model)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Features

- People management: add, edit, delete people and attributes (name, age, gender, activity, how you met)
- Event tracking: add events with date, details and optional score; edit/delete events
- Analytics dashboard: overview, time-based analysis, distributions by attributes, score analysis
- Export stats as PDF
- Localization: English and Spanish
- Local persistence (browser/device storage)

## Demo

No hosted demo is available for this repository. You can run the app locally (see Getting Started).

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- Recharts
- jsPDF
- Capacitor (for native mobile packaging)

## Project Structure

Key files and folders:

- `src/` — application source
  - `components/` — UI components grouped by feature
  - `lib/` — utilities and helpers (constants, date, storage, pdf export)
  - `App.jsx`, `main.jsx`
- `capacitor.config.json` — Capacitor config (webDir: `dist`)
- `package.json` — npm scripts and dependencies

## Getting Started

### Prerequisites

- Node.js (LTS) and npm
- For mobile builds: macOS + Xcode (iOS), or Android Studio + Android SDK (Android)

### Install

```bash
npm install
```

### Development

Run the dev server with hot reload:

```bash
npm run dev
```

Open your browser at the address shown by Vite (usually `http://localhost:5173`).

### Build

Create the production web build (output goes to `dist`):

```bash
npm run build
```

## Capacitor / Mobile (iOS & Android)

This repository is a web app that can be packaged with Capacitor into native apps. The web build output directory is `dist` as defined in `capacitor.config.json`.

Important: final native builds require platform-specific tooling:

- iOS: macOS with Xcode
- Android: Android Studio and Android SDK (can be built from Linux)

Common workflow (on macOS for iOS):

```bash
# after building web assets
npm run build

# add the platform (only once)
npx cap add ios

# sync web assets into the native project after web changes
npx cap sync ios

# open Xcode project
npx cap open ios
```

After opening in Xcode, set signing, verify capabilities, and run on a simulator or device.

### iOS notes and permissions

- This app records audio; you must add the microphone usage description to the app's `Info.plist`.

Example `Info.plist` entry (XML):

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Kiss Recorder needs access to the microphone to record audio for events.</string>
```

- Ensure the app `Bundle Identifier` in Xcode matches a provisioning profile and a Team is selected under Signing.

### Android notes

- Android platform can be added on Linux/Windows:

```bash
npx cap add android
npx cap sync android
npx cap open android
```

- For production builds, configure keystore signing in the Android project and set required permissions in `AndroidManifest.xml`.

## Data Model (Simplified)

```js
Person {
  id: string
  name: string
  age: number
  gender: string
  zodiacSign: string
  activity: string
  howWeMet: string
  events: Event[]
}

Event {
  id: string
  date: string
  details: string
  score: number | null
}
```

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make changes and add tests when applicable
4. Open a PR with a clear description of changes

Please keep changes focused and follow existing code style patterns (React + functional components, utilities in `lib/`).

## Troubleshooting

- If the native build can't find web assets, confirm you ran `npm run build` and then `npx cap sync <platform>`.
- For iOS build issues on Xcode, check signing settings and valid provisioning profiles.
- If audio recording fails on a device, verify microphone permission and that the runtime permission prompt was accepted.

## License

MIT

## Acknowledgements

- Built with Vite, React and Capacitor.
- Icons and UI libraries credited in `package.json`.

---

If you'd like, I can:

- add a small CONTRIBUTING.md
- add a quick `make ios` script for macOS to automate `build` + `cap sync` steps
- or also add example screenshots to this README

Tell me which one you'd like next.

---

## iOS (Capacitor) Setup

This project is a web app packaged with Capacitor. You can run it on iOS, but building and running the native iOS app requires a macOS machine with Xcode.

Prerequisites (on macOS):
- Install Xcode from the App Store
- Install Node.js and npm
- Install CocoaPods (if needed for native dependencies): `sudo gem install cocoapods`

Steps to prepare and run on iOS:

1. Install dependencies and build the web app:

```bash
npm install
npm run build
```

2. Add and sync the iOS platform (run these on macOS):

```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

3. In Xcode:
- Select a Team for signing (Project > Signing & Capabilities).
- Add required permissions to `Info.plist` (see below).
- Build and run on a simulator or a connected device.

Important permissions

If your app records audio, add `NSMicrophoneUsageDescription` to the app Info.plist with a user-facing reason. Example plist entry (XML view):

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to the microphone to record audio for events.</string>
</code>
```

Notes
- The Capacitor `webDir` is set to `dist` in `capacitor.config.json`, which matches Vite's default output.
- You can prepare the web build on Linux and then run the iOS platform steps on a mac — but the final native build requires Xcode.
- After making web changes, run `npx cap sync ios` again to update the native project.

If you want, I can add a short section with the exact `NSMicrophoneUsageDescription` wording you'd like, or prepare a small developer checklist in this README.