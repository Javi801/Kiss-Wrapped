# Kiss Recorder

![build status](https://img.shields.io/badge/status-development-yellow)
![license](https://img.shields.io/badge/license-MIT-blue)

A lightweight personal tracking web app to log interactions ("events") with people, analyze patterns, and visualize statistics over time. Built with React, Tailwind CSS and packaged with Capacitor for mobile support.

<!-- toc -->
## Table of Contents

- [Features](#features)
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
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- People management: add, edit, delete people and attributes (name, age, gender, activity, how you met)
- Event tracking: add events with date, details and optional score; edit/delete events
- Analytics dashboard: overview, time-based analysis, distributions by attributes, score analysis
- Export stats as PDF
- Localization: English and Spanish
- Local persistence (browser/device storage)

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

## Troubleshooting

- If the native build can't find web assets, confirm you ran `npm run build` and then `npx cap sync <platform>`.
- For iOS build issues on Xcode, check signing settings and valid provisioning profiles.
- If audio recording fails on a device, verify microphone permission and that the runtime permission prompt was accepted.

## License

MIT