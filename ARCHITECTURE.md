# Architecture

This document describes how Kiss Wrapped is built: its layers, state and data flow, persistence, and the rules that keep the codebase consistent. For features, setup, and build commands see [README.md](README.md).

## System overview

Kiss Wrapped is a single-page React app packaged as a native app with Capacitor. There is no backend, no network access, and no account. All data lives on the device.

| Concern | Choice |
|---|---|
| UI | React 19 (JavaScript + JSX, no TypeScript) |
| Build | Vite 8, `@` alias to `src/` |
| Styling | Inline style objects fed by a palette context; Tailwind 4 + shadcn/ui (Radix) for primitives |
| Charts | Recharts, plus custom SVG/HTML charts |
| Animation | framer-motion |
| Native shell | Capacitor 8 (`@capacitor/app`, `filesystem`, `share`) and one custom Android plugin |
| Export | `html-to-image` (chart PNG), `jspdf` (PDF deck, behind a feature flag) |
| Tests | Vitest, V8 coverage (thresholds scoped to `src/lib/`) |

## Repository layout

```
src/
  main.jsx              Entry point. Mounts <ErrorBoundary><App/></ErrorBoundary>
  App.jsx               Application shell: composes the app hooks, defines the mutations,
                        and renders the active screen
  __tests__/            Unit tests for App.jsx and the hooks it composes
  hooks/                Hooks used by App.jsx: usePersistedAppState (people, settings, boot,
                        save), useAppNavigation (screen, history, back button),
                        usePrivacyOverlay (backgrounded state); plus useScrollFade (edge
                        fade of a scroll container), used by ui/dialog and PeopleToolbar
  index.css             Tailwind + shadcn theme tokens
  shadcn-tailwind.css   Vendored copy of shadcn's `tailwind.css`, imported by index.css
  components/
    app/                Top-level screens and app-level widgets (Home, AddPerson, Intro,
                        Onboarding, Privacy, ErrorBoundary, Color selector), FormCard,
                        plus the sections and dialogs of the Home screen (HomeHeroCard,
                        HomeActions, HomeSettingsDialogs, TagsDialog, AboutDialog, AppGuideDialog, OnboardingDoneDialog,
                        BottomNav, JsonExportDialogs, ImportDialogs, ImportPartnerDialogs)
      onboarding/       The onboarding wizard (OnboardingWizard), its steps (Onboarding*Step,
                        OnboardingFormStep), the tour player (OnboardingTour), the scene
                        lists (onboardingScenes.js), and OnboardingButton
    people/             People list screen (PeopleManagerScreen) and its parts: PeopleToolbar
                        (search, filter sheet), AlphabetIndex, PeopleGroupList, EmptyState, the
                        usePeopleList hook, and the pure filter/sort/group helpers (peopleList.js)
    person/             PersonCard: one person's profile and event list, split into
                        PersonCardHeader, PersonCardDetails, PersonCardActions,
                        PersonEventList, PersonCardDialogs, and the usePersonCardModals hook
    forms/              PersonForm, PartnerFields, EventForm, FiltersPanel, TagInput, SpeechBubble
    stats/              Stats screen, its four tabs, and stat-specific cards
    charts/             Generic, data-agnostic chart cards and fullscreen/export wrapper.
      timeline/         The persons and events timeline cards, the TimelineChartCard they
                        share (TimelineChart* and useTimelineChart), and its period picker
                        TimelineCalendarPopup (TimelineCalendar* and useTimelineCalendar)
    shared/             Small reusable tiles and the SparkleIcon
    visuals/            Decorative backgrounds and animations
    ui/                 shadcn/ui primitives (generated; see components.json)
    */__tests__/        Unit tests next to the components they cover
  lib/                  Framework-light logic: dates, stats, formatting, storage, constants
    config.js           Central configuration: feature flags, metadata, defaults, limits
    translations/       UI strings, one file per language (grouped as COPY in constants.js),
                        with the app guide texts in a separate file per language (*-guide.js)
    __tests__/          Unit tests for lib/
  plugins/              JS wrappers for custom Capacitor plugins
    __tests__/          Unit tests for plugins/
android/                Capacitor Android project (MainActivity, AppIconPlugin, manifest)
ios/                    Capacitor iOS sources
scripts/                Build-time tooling (launcher icon generator)
fixtures/               Sample data dump usable as an import file
```

## Layers and dependency rules

```
components/app, people, person, stats      screens and feature components
        │
        ▼
components/forms, charts, shared, visuals  reusable building blocks
        │
        ▼
components/ui                              shadcn primitives
        │
        ▼
lib/  ◄── plugins/                         logic, constants, storage, native bridges
```

Rules that hold today and should be preserved:

- `lib/` never imports from `components/`. It is the only layer with enforced coverage thresholds.
- `components/charts/` is generic: charts receive already-aggregated `{ label, value }`-style data and know nothing about people or events. Domain-specific cards live in `components/stats/` and compose charts.
- `components/ui/` is generated by shadcn. Restyle through props/`className`/`style` at the call site rather than editing these files.
- `shadcn` is not an installed dependency. Generate primitives with `npx shadcn@latest add <component>` (configured by `components.json`). `src/shadcn-tailwind.css` is a copy of the package's `dist/tailwind.css`; its header comment records the source version, and it must be re-copied by hand to pick up upstream changes.
- `hooks/` holds the stateful logic of the app shell. It imports from `lib/` and never from `components/`, and it is outside the coverage scope.
- A hook or helper module that serves a single component lives next to that component, not in `hooks/` or `lib/`: `usePeopleList` and `peopleList.js` in `components/people/`, `usePersonCardModals` in `components/person/`, `useTimelineChart`, `TimelineChartSeries.js`, `useTimelineCalendar`, and `TimelineCalendarHelpers.js` in `components/charts/timeline/`. When one component's parts would crowd a folder shared with unrelated components, they get a subfolder with its own `__tests__/`, as `charts/timeline/` and `app/onboarding/` do.
- `PersonsTimelineChartCard` and `EventsTimelineChartCard` only count their data per date and per month and pass it to `TimelineChartCard`, which owns the granularity and navigation state (`useTimelineChart`), the series (`buildTimelineSeries`), and the rendering. A change to the timeline layout or periods goes in the shared modules, not in the two cards.
- Capacitor APIs are imported in a small set of files only: `hooks/useAppNavigation.js`, `hooks/usePrivacyOverlay.js`, `lib/device-storage.js`, `lib/pdf-export.js`, `plugins/appicon.js`, `components/app/ErrorBoundary.jsx`, and `components/charts/FullscreenChartWrapper.jsx`.
- Imports use the `@/` alias.

## Configuration

`lib/config.js` is the single place for values that are meant to be tuned. Change behavior there instead of commenting code out or editing literals in components.

| Export | Purpose |
|---|---|
| `FEATURES` | Feature flags. `pdfExport` gates the PDF button in `StatsScreen`; `onboarding` gates the onboarding wizard for new installs, decided in the `usePersistedAppState` boot, and its restart from the settings. `pdfExport` is currently `false` and `onboarding` is `true` |
| `APP_VERSION`, `APP_GITHUB_USER`, `APP_GITHUB_REPO` | Metadata shown in the UI |
| `LANGUAGES`, `THEMES`, `ICON_COLORS` | Supported setting values. A persisted value outside these lists is ignored at boot. `ICON_COLORS` holds the icon variants: a design (`notebook`, `chart`, `orbit`) plus a color (`pink`, `lavender`, `green`), e.g. `notebookPink` |
| `DEFAULT_SETTINGS` | Initial `language`, `theme`, `iconColor`, `statsVisible`, `includePartnerEvents` |
| `LIMITS` | Input lengths, maximum age, and the size of the top-people ranking |
| `ONBOARDING` | Tour scene timings in milliseconds (`sceneMs`, `tapTimeoutMs`, `introSceneMs`) and the age of the practice person (`practiceAge`) |

Rules:

- **Defaults never override a saved choice.** `DEFAULT_SETTINGS` only seeds the initial React state and fills settings that were never saved. Once a setting is persisted, changing its default in `config.js` does not affect existing installs. `device-storage.test.js` covers this for the web path, the native settings file, and the first-run migration.
- **Supported lists must match their sources.** `THEMES` must equal the keys of `PALETTES`, `LANGUAGES` the keys of `COPY` and `ZODIAC_OPTIONS`, and `ICON_COLORS` the keys of `ICON_VARIANTS` in `SparkleIcon.constants.js`, the colors in `AppIconPlugin.java`, and the `activity-alias` entries in `AndroidManifest.xml`. `DEFAULT_SETTINGS.iconColor` must equal `DEFAULT_ICON_VARIANT`, the alias enabled in the manifest and the plugin's fallback variant; otherwise the picker shows one icon and the launcher another. `config.test.js` enforces all of this.
- **A new feature flag wraps working code.** Gate the entry point with `FEATURES.<name>` and keep the code compiled and linted, so the flag is the only thing to flip.
- **Storage keys and file names are not configuration.** They are a data contract and stay in `lib/constants.js`.

## State management

There is no state library. All global state is `useState` inside three hooks in `src/hooks/`, called once by `App.jsx`, which stays the single source of truth.

| State | Meaning |
|---|---|
| `people` | The whole dataset: an array of persons, each with nested `events` |
| `screen` | Current screen key |
| `language`, `theme`, `iconColor`, `statsVisible`, `includePartnerEvents` | User settings |
| `situationTags`, `placeTags`, `howWeMetTags`, `nationalityTags` | Tag suggestions for form inputs |
| `onboardingDone` | Whether the onboarding was completed or does not apply |
| `isLoaded` | Guards persistence until the initial load has finished |
| `isPrivate` | App is backgrounded; shows the privacy overlay |

`screen` lives in `useAppNavigation`, `isPrivate` in `usePrivacyOverlay`, and everything else in `usePersistedAppState`. `isLoaded` and `onboardingDone` are internal to `usePersistedAppState`, which exposes the derived `onboardingPending` and `completeOnboarding()` instead of their setters.

All mutations (`addPerson`, `updatePerson`, `deletePerson`, `addEvent`, `updateEvent`, `deleteEvent`, `deleteAllEvents`, `importAppData`, `clearAllAppData`, `removeTag`) are defined in `App.jsx` and passed down as callback props. Children never mutate `people` directly, and updates are always immutable.

Two React contexts exist, both provided by `App.jsx`:

- `ThemeProvider` / `usePalette()` (`lib/theme.jsx`): the active color palette object.
- `CopyProvider` / `useCopy()` (`lib/copy.jsx`): the active translation dictionary.

In practice the dictionary is passed down as a `t` prop almost everywhere; `useCopy()` is used only where prop drilling is impractical (`FullscreenChartWrapper`). Follow the surrounding code: accept `t` as a prop in components that already receive props from a screen.

## Navigation

There is no router. `screen` is one of the names in `SCREENS` (`lib/constants.js`) and `App.jsx` conditionally renders one screen. Code refers to a screen through `SCREENS`, never through a string literal.

| Key | Screen | Notes |
|---|---|---|
| `boot` | blank | Until settings are read |
| `intro` | `IntroScreen` | Neutral entry screen shown on every launch; acts as a privacy decoy. While the onboarding is pending it renders `IntroEntryGuide`, which points out the hidden heart |
| `main` | `HomeScreen` | Dashboard, settings, import/export |
| `add` | `AddPersonScreen` | Focused layout, no bottom bar |
| `people` | `PeopleManagerScreen` | List, filters, person cards, event editing |
| `stats` | `StatsScreen` | Four tabs: overview, time, people, scores |
| `onboarding` | `OnboardingWizard` | Opened by the intro heart, instead of `main`, while the onboarding is pending, and from the settings to repeat it. Cannot be skipped; finishing it goes to `main` and opens `OnboardingDoneDialog`. See [Onboarding](#onboarding) |

- `useAppNavigation` (`hooks/useAppNavigation.js`) owns `screen`, the history stack, and `modalBackRef`.
- `StatsScreen` is the only screen loaded on demand (`React.lazy` in `App.jsx`), which keeps the charting libraries out of the initial chunk. `App.jsx` fetches its chunk after the first render and renders a spinner as the `Suspense` fallback when the screen is opened before the chunk arrives.
- `navigateTo(screen)` pushes the current screen onto `screenHistoryRef` and switches. `resetTo(screen)` switches and empties the stack.
- The Android hardware back button is handled by one Capacitor listener in `useAppNavigation`:
  1. If a select is open, close it and stop. `ui/select.jsx` registers every open select in `lib/open-selects.js`, so selects need no `modalBackRef` wiring.
  2. If `modalBackRef.current` is set, call it and stop.
  3. From `add`, always go to `intro`. From `intro`, exit the app.
  4. Otherwise pop the history stack; with an empty stack go to `main`, or exit if already there.
- **Modal contract:** any component that opens a dialog, sheet, or overlay must set `modalBackRef.current` to a close callback while it is open and reset it to `null` when closed, so the back button closes the overlay instead of navigating. See `HomeScreen`, `usePersonCardModals` (for `PersonCard`), `PeopleToolbar` (for `PeopleManagerScreen`), and `StatsScreen` for the pattern.
- Saving a new person and clearing data both reset the history and return to `intro` by design.

### Onboarding

`OnboardingWizard` is a sandbox: it never reads or writes the saved people, so it can run on a new install and be repeated from the settings with real data present.

- **Steps** are listed in `ONBOARDING_STEPS` and the step counter total follows that list. An entry is either a component, `{ Component, ownsActions }`, or a tour, `{ scenes }`. A component marked `ownsActions` renders its own buttons and advances through `onNext`; otherwise the wizard shows its next/finish button. A tour is played by `OnboardingTour` and advances when its last scene ends. The steps are the welcome (`OnboardingWelcomeStep`), the person form (`OnboardingPersonStep`), the tour to the person card (`PERSON_CARD_SCENES`), the event form (`OnboardingEventStep`), and the return to the home screen (`HOME_HINT_SCENES`).
- **Practice data** lives only in the wizard state and is discarded when the wizard unmounts. The person and event steps reuse `PersonForm` and `EventForm` with a skip action; skipping completes what was typed through `completePracticePerson` and `completePracticeEvent` (`lib/onboarding.js`). Both steps share their layout (`OnboardingFormStep`, with the `FormCard` that `AddPersonScreen` also uses) and play a tour before or after the form.
- **Tours** (`OnboardingTour`) play a list of scenes over the real `HomeScreen`, `PeopleManagerScreen` and `IntroScreen`, fed with the practice person, with `BottomNav` when a scene asks for it. Every scene list lives in `components/app/onboarding/onboardingScenes.js`; the scene shape is documented in `OnboardingTour`. A scene names its screen with `SCREENS`, and what it points at with the screen a button or bottom-bar item leads to, or with `TOUR_TARGETS` (`lib/onboarding.js`) for what is not a screen; its texts are translation keys. A scene naming a screen the tour does not know renders none. The screens are out of reach: taps are disabled and `setInertExcept` (`lib/inert.js`) makes everything inert per scene, except the speech bubbles and the control marked `data-tour-target`. A scene moves on by itself after `duration` or `ONBOARDING.sceneMs`, from its own button, or from a tap on the control it points at; a scene waiting for a tap moves on by itself after `ONBOARDING.tapTimeoutMs` unless it is `tapOnly`. The screens take optional tour props (`tourTarget` and `tourHint` on `HomeScreen`, `cardTour` on `PeopleManagerScreen`, `tour` on `PersonCard`, `tourTarget` on `BottomNav`) that show the tap guide (`visuals/TapGuide`) and speech bubbles (`forms/SpeechBubble`). None of them has any effect when it is not passed.
- **Tour hooks** are defined once in `lib/onboarding.js`: `tourTargetProps(guided, style)` returns the `style` and the `data-tour-target` attribute of a control the tour can point at, `SPEECH_BUBBLE_ROLE` is the role of the speech bubbles, `TOUR_KEEP_SELECTOR` is what stays reachable, and `TOUR_LAYERS` is the stacking order of the wizard, the backdrop of a hinted scene, the raised controls and bubbles, and the tour button.
- **Finish.** `handleOnboardingComplete` in `App.jsx` calls `completeOnboarding()`, resets the history to `main`, and opens `OnboardingDoneDialog` on `HomeScreen` (`onboardingDoneOpen` / `onCloseOnboardingDone`), a notice that points to the app guide in the settings. It runs on the first run and after a restart alike.
- **Restart.** `HomeScreen` receives `onRestartOnboarding` only while `FEATURES.onboarding` is on; it navigates to `onboarding` without touching `onboardingDone`, so the hardware back button returns to `main`.
- **App guide.** `AppGuideDialog`, opened from the settings, renders `APP_GUIDE_SECTIONS` (`components/app/appGuideSections.js`): each entry is an icon plus translation keys for a title and its texts.

## Data model

Authoritative shape as produced by the forms and `normalizePeople`:

```js
Person {
  id:            string           // uid(), 8 base-36 chars
  name:          string
  realName:      string           // optional, '' when absent
  nationality:   string           // optional free-text tag, '' when absent
  birthYear:     number           // derived from entered age + zodiac sign
  birthdayAlreadyHappened: boolean
  zodiacSign:    string           // full localized option, e.g. "♍ Virgo (August 24 - September 22)"
  gender:        'male' | 'female' | 'other'
  activity:      'studies' | 'works' | 'studies and works' | <other>
  detail:        string           // free text
  howWeMet:      string
  partnerStatus: 'never' | 'current' | 'past'
  partnerFrom:   string           // "yyyy.MM.dd" or ''
  partnerTo:     string           // "yyyy.MM.dd" or '' (only for 'past')
  events:        Event[]          // newest inserted first
}

Event {
  id:           string
  date:         string            // "yyyy.MM.dd"
  place:        string
  situation:    string
  details:      string
  observations: string
  score:        number | null     // integer 0..5, or null for "no score"
}
```

Invariants:

- **Dates are `yyyy.MM.dd` strings everywhere.** They sort and compare correctly as plain strings; the code relies on this. Parse and validate only through `lib/date.js` and `lib/calendar.js`.
- **Age is never stored.** It is computed at runtime from `birthYear` and the zodiac sign's end date (`calculateAge`, `calculateAgeAtEvent`). Use the `effectiveAge*` helpers in `lib/date.js` from UI code; they also handle legacy records that still carry a static `age`.
- **Gender and activity are stored as language-neutral keys** (`GENDERS` and `ACTIVITIES` in `lib/constants.js`) and translated at render time with `translateGender` / `translateActivity`.
- **`zodiacSign` is stored as the full localized string.** Its leading emoji is the language-independent key; convert between languages with `getZodiacForLanguage`, and get a display label with `getShortZodiacLabel`.
- **Real name and nationality are set only when editing.** `PersonForm` renders them only with `includeRealName` and `includeNationality`, which the edit dialog in `PersonCardDialogs` passes and `AddPersonScreen` does not; when a field is hidden, the form keeps the stored value. Both are optional and default to `''` in `normalizePeople` and `normalizeForExport`. Nationality is a tag input over `nationalityTags` and is compared ignoring case and surrounding spaces, as the people filter does, so the same value is not counted twice.
- **Scores are validated with `hasScore`.** Anything that is not an integer 0–5 is normalized to `null` on write and on load.
- **Partner fields are validated in `lib/partner.js`.** `validatePartnerFields` is the single set of rules (valid `yyyy.MM.dd` dates, none in the future, `partnerFrom` on or before `partnerTo`, and `past` requires `partnerTo`). It returns error codes, which `translatePartnerError` in `lib/format.js` turns into text. `PersonForm` and the import fix table both use it through `PartnerFields`. `PersonForm` renders `PartnerFields` only when it receives `includePartner`, which the edit dialog in `PersonCardDialogs` passes and `AddPersonScreen` does not: every person is created as `never`, and the status is changed only by editing the person from the people list. `never` is a complete value, so it never marks a person as incomplete. `partnerFrom` is kept only for `current` and `past`, and `partnerTo` only for `past`.
- **Partner periods.** `getPartnerPeriod` / `excludePartnerEvents` in `lib/stats.js` remove events that fall inside a partner period from event-based statistics. Whether they are removed is the user's choice, stored in the `includePartnerEvents` setting (`false` by default): `getEventPeople(people, includePartnerEvents)` returns the unfiltered list when it is `true` and the filtered one otherwise, and it is the only function that reads the setting. Person-based statistics (counts by gender, age, zodiac) always use the unfiltered list. Any new statistic must pick the correct list.

## Persistence

`lib/device-storage.js` is the only persistence module. It branches on `Capacitor.isNativePlatform()`:

| | Native (Android/iOS) | Web (dev/browser) |
|---|---|---|
| People | `kiss-wrapped-people.json` in `Directory.Data` | `localStorage['kiss-wrapped-local-v3']` |
| Settings | `kiss-wrapped-settings.json` in `Directory.Data` | one `localStorage` key per setting |

Lifecycle:

1. **Boot** (`hooks/usePersistedAppState.js`): `loadPeopleFromDevice()` → `normalizePeople()` → `setPeople`; then `loadSettings()` → validate each value against the supported lists in `lib/config.js` → set state. Values that were never saved fall back to `DEFAULT_SETTINGS`. Tag lists are merged with values already present in the data (`mergeEventTagsFromPeople`, `mergePeopleFieldTags`), and `App.jsx` registers the how-we-met and nationality values of added, edited and imported people the same way. Because of this merge, a tag still used by a person or event would come back on the next boot, so deleting one from `TagsDialog` (opened from the settings) also clears it from the data: `removeTag` in `App.jsx` drops it from its list and calls `clearTagFromPeople` (`lib/helpers.js`), which empties that field, ignoring case and surrounding spaces, in the people or events that use it and keeps the records. The confirmation shows how many use it (`countTagUses`) and, for the required fields in `TAG_FIELDS`, warns that those records become incomplete. The hook receives `setScreen` and always opens `intro`. It also decides whether the onboarding is pending: only when `FEATURES.onboarding` is on, `onboardingDone` was never saved as `true`, and there are no saved people, so updating users never see it. While it is pending the language is the device language (`detectDeviceLanguage`) instead of the saved one or the default. Otherwise `onboardingDone` is saved as `true`. When loading throws, the boot falls back to an empty dataset in the device language and the onboarding is not pending: a failed load is not treated as a new install. Then `isLoaded = true`.
2. **Save**: two effects in the same hook write the full people array and the full settings object whenever they change, only after `isLoaded` is true. This guard prevents overwriting stored data with the initial empty state; keep it for any new persisted state.
3. **Partner data is sanitized on load** without asking the user. `normalizePeople` calls `sanitizePartnerFields` (`lib/partner.js`): a date that is not a valid `yyyy.MM.dd` string becomes `''`, an inverted range drops `partnerFrom`, `past` without a valid `partnerTo` becomes `never`, and an unknown status becomes `current` when the record has `isPartner: true` and `never` otherwise. Future dates are kept, so the result does not depend on the day it runs.
4. **Migrations run on load**, not as a separate step: legacy `age` → `birthYear` (`migrateLegacyAge`), legacy `isPartner` → `partnerStatus` (`resolvePartnerStatus`, called from `normalizePeople`), and `localStorage` settings → native settings file (first native run).

Storage keys and file names in `lib/constants.js` are part of the on-device data contract. Do not rename them. When the data shape changes, add a tolerant migration in the load path and keep reading the old shape.

### Import, export, and sharing

- **JSON backup export**: `exportPeopleJson` fills missing required fields, writes to `Directory.Cache`, opens the native share sheet, then deletes the temp file.
- **JSON import**: `HomeScreen` reads and parses the file and keeps the flow in its `importStatus` state. `buildImportStatus` (`lib/import-people.js`) requires an array of objects and skips persons whose `id` already exists. `ImportDialogs` renders one dialog per status type and asks for confirmation; `HomeScreen` then calls `importAppData`, which normalizes and appends.
- **Invalid partner data on import**: `buildImportStatus` runs `hasPartnerIssues` (`lib/partner.js`) on the new people only. It flags an unknown `partnerStatus` and anything `validatePartnerFields` rejects, including future dates. When at least one person is flagged, `ImportPartnerDialogs` replaces the confirmation with a notice that offers to cancel, to import only the valid people, or to fix the flagged ones. The fix table has one row per flagged person, prefilled by `prefillPartnerFields`, where each row is corrected or discarded; importing is allowed once every row is valid or discarded. `skipPartnerIssues` and `resolvePartnerIssues` (`lib/import-people.js`) build the list of people that is finally imported in each case. The rows are kept in `HomeScreen`'s `importStatus` (types `partner_issues` and `partner_resolve`), so going back from the table to the notice keeps the edits. The boot path never shows these dialogs.
- **Chart PNG export**: `FullscreenChartWrapper` renders the chart with `html-to-image` and shares it the same way.
- **Crash and error logs**: `ErrorBoundary`, `FullscreenChartWrapper`, and `saveErrorLog` write a text file to cache and share it. Nothing is sent automatically.

All of these follow the same sequence: write to `Directory.Cache` → `Filesystem.getUri` → `Share.share({ files })` → best-effort delete.

## Statistics

- `StatsScreen` derives two shared datasets with `useMemo`: `eventPeople` (`getEventPeople`, so partner-period events are removed unless `includePartnerEvents` is on) and `allEvents` (flattened events, each with a `person` reference). It passes them to the tabs.
- `StatsScreen` renders the toggle for `includePartnerEvents` above the tab grid, only when at least one person has a partner period. The value and its setter come from `App.jsx`, so the choice is persisted and every chart of every tab recomputes when it changes. `HomeHeroCard` receives the same value and uses `getEventPeople` for its total-events tile, which keeps both screens in agreement. Fullscreen charts have no toggle and show the current choice.
- Aggregations are pure functions exported from `lib/stats.js` (`groupByZodiac`, `getTopPeople`, `getScoresByKisses`, …). Each tab (`StatsOverviewTab`, `StatsTimeTab`, `StatsPeopleTab`, `StatsScoresTab`) calls the ones it needs inside `useMemo` and renders chart cards.
- `getStatsData` in `lib/stats.js` composes those same functions into one object. It is used only by the PDF export (`FEATURES.pdfExport`) and always removes partner-period events: it does not read `includePartnerEvents` yet. Where screen and PDF present a statistic differently (all 12 zodiac signs vs. a ranking, the zero-kiss score, zero-filled ranges), the difference is an explicit option of the shared function.
- Any chart wrapped in `FullscreenChartWrapper` gets fullscreen and PNG export. Charts read `useFullscreen()` to adapt their layout when expanded.

## Theming and styling

- Three palettes: `pink`, `green`, `dark`, defined in `PALETTES` in `lib/constants.js`. Every palette must define the same keys. The default theme is `DEFAULT_SETTINGS.theme` in `lib/config.js`.
- Components read colors with `usePalette()` and apply them through inline `style` objects. Typography uses the `TEXT` scale from `lib/constants.js`, spread into styles. Do not hardcode colors or font sizes in components. Overlay and shadow colors are palette keys too (`backdrop`, `topGlow`, `calloutBg`, `calloutShadow`, `shadow`, `shadowStrong`); `DialogContent` takes `overlayStyle` to color its overlay from the palette. The dialogs opened from the settings (`TagsDialog`, `AppGuideDialog`, `AboutDialog`) share `dialogBg` and `dialogBorder`, which equal `bgSoft` and `line` in the light palettes and are a raised surface with a brighter outline in `dark`, so the window stands out from the dimmed screen and its controls stand out from it. Closing any of them (corner X, back button or tapping outside) reopens the settings. The settings and these dialogs replace each other in one render; `settingsDialogTransition.js` turns off their overlay animations and their exit animation, so no frame shows the home screen undimmed in between.
- Tailwind classes are used mainly inside `components/ui/` and for a few utilities such as border radius. `cn()` from `lib/utils.js` merges class names.
- When the theme is `dark`, `App.jsx` also toggles the `dark` class on `<html>` so shadcn components rendered in portals pick up dark styles.
- `PALETTE` (the pink palette) is exported for non-React modules such as `pdf-export.js`.

## Localization

- All UI strings live in one file per language, `lib/translations/en.js` and `lib/translations/es.js`. The app guide texts (`appGuide*`, `guide*`) are kept apart in `en-guide.js` and `es-guide.js` and spread into those dictionaries, so the files stay under the ESLint `max-lines` limit. `COPY` in `lib/constants.js` groups them under `en` and `es`. Every key must exist in both languages; `constants.test.js` enforces it.
- No user-facing string is hardcoded in components.
- `detectDeviceLanguage()` maps the device locale to `en` or `es` and is used as a fallback (for example in `ErrorBoundary`, which renders outside the providers) and as the language of a new install while the onboarding is pending.

## Native layer

Android (`android/app/src/main/`):

- `MainActivity` blanks the app-switcher thumbnail while keeping screenshots allowed in the foreground: on Android 13+ it calls `setRecentsScreenshotEnabled(false)`; on older versions (including EMUI) it sets `FLAG_SECURE` in `onPause` and clears it in `onResume`. It also registers `AppIconPlugin`.
- `AppIconPlugin` (`AppIcon.setColor`) switches the launcher icon by enabling one of nine `activity-alias` entries, one per icon variant (`AliasNotebookPink`, `AliasNotebookLavender`, `AliasNotebookGreen`, `AliasChartPink`, `AliasChartLavender`, `AliasChartGreen`, `AliasOrbitPink`, `AliasOrbitLavender`, `AliasOrbitGreen`), declared in `AndroidManifest.xml`. Each alias points to an adaptive icon in `res/mipmap-anydpi-v26/` with its own background and foreground images; `AliasNotebookPink` is the one enabled by default. It is called from JS through `plugins/appicon.js`, which silently no-ops where the plugin is unavailable. Call it only from a direct user action, because changing aliases can make Android kill the app.
- `android:allowBackup="false"` keeps app data out of system backups.
- `scripts/generate-icon.mjs` (`npm run gen:icon`) uses `sharp` to build every icon image from the two source layers per variant in `assets/icons/<resource>/` (`foreground.png`, `background.png`): the adaptive foreground and background and the legacy icon (API < 26) for each density, the default `ic_launcher*` files, and the composed image per variant in `src/assets/icons/` that `SparkleIcon.jsx` shows inside the app. The layers come from the metro mockups in `mockups/icons/metro/`: the foreground is the transparent glyph centered on a 1.5x canvas (so the 1024px mockup fills the 72dp visible area) and the background is the mockup's solid color. All outputs are WebP and are committed. It imports the variant keys, resource suffixes and image names from `components/shared/SparkleIcon.constants.js`, the same module `SparkleIcon.jsx` reads, so that file must stay importable by plain Node (no JSX, no `@/` imports). Android resource names only allow `a-z`, `0-9` and `_`, hence the snake_case suffix next to each camelCase key.

Privacy mechanisms, in addition to the above:

- `PrivacyScreen` overlay is shown while the app is backgrounded. On native it is shown on the `pause` DOM event and hidden on Capacitor `appStateChange` (the `resume` event fires spuriously on EMUI); on web it follows `visibilitychange`.
- `index.html` sets a Content Security Policy with `connect-src 'none'`, so the web layer cannot make network requests. Do not add dependencies or features that need the network.

## Testing and quality gates

- Tests live in a `__tests__/` folder next to the code they cover: `src/lib/__tests__/`, `src/plugins/__tests__/`, `src/components/<area>/__tests__/`, and `src/__tests__/` for `App.jsx` and `src/hooks/`. The hooks `App.jsx` composes are tested through it; `useScrollFade` has its own file. All of them are unit tests except `components/app/onboarding/__tests__/onboarding-tour.integration.test.jsx`, which plays the onboarding tours over the real `HomeScreen` and `PeopleManagerScreen` with only the palette mocked.
- `lib/` is fully covered. Component coverage is broad: the app shell, the screens (`HomeScreen`, `PeopleManagerScreen`, `AddPersonScreen`, `IntroScreen` with its `IntroEntryGuide`, `OnboardingWizard`, `StatsScreen` and its tabs), forms (`PersonForm`, `PartnerFields`, `EventForm`, `TagInput`, `FiltersPanel`), `PersonCard` with its `PersonCardActions` row, the chart cards and `FullscreenChartWrapper`, selectors, shared tiles, the `ui/` dialog, sheet and select wrappers, and `ErrorBoundary` have tests; `visuals/` has none. Logic still belongs in `lib/`, where it is cheapest to test.
- Component tests mock their children and the palette (`vi.mock('@/lib/theme')`) and assert on the props handed to those children or on the rendered output. Static components render with `renderToStaticMarkup`; components with state, effects, or event handlers render with `createRoot` + `act` under jsdom. There is no testing-library dependency.
- `config.test.js` checks that the configuration is consistent with the code it describes (supported lists, defaults, limits) and pins the current feature flag values, so releasing a feature means updating the flag and its test together.
- The default Vitest environment is `node`. Files that need the DOM opt in with a `// @vitest-environment jsdom` pragma.
- Coverage is collected for `src/lib/**/*.js` only, excluding `device-storage.js` and `utils.js`, and the thresholds (statements 95, branches 90, functions 95, lines 95) apply to that scope. Tests for components, `App.jsx`, `hooks/`, `plugins/`, and the `.jsx` files in `lib/` run in the suite but do not count towards the thresholds.
- Pre-push hook (husky, `.husky/pre-push`): Prettier checks `src/**/*.{js,jsx}`, then the full test suite runs. There is no pre-commit hook.
- CI (`.github/workflows/ci.yml`) runs on pushes and pull requests to `main` and `dev`: lint, `knip` (unused code and dependencies), the Prettier check, tests with coverage, and the build. A second job audits the production dependencies (`npm audit`). A separate workflow (`.github/workflows/dependency-review.yml`) runs a dependency review on pull requests to `main` and `dev` only.
- Formatting: Prettier with no semicolons, single quotes, width 100. ESLint flat config with React, hooks, and react-refresh rules.

## Where to make common changes

| Task | Touch |
|---|---|
| Enable, disable, or add a feature flag | `FEATURES` in `lib/config.js`, plus its pinned value in `config.test.js` |
| Change a default setting, a length limit, an onboarding timing, or app metadata | `lib/config.js` |
| Add or change a UI string | `lib/translations/en.js` and `lib/translations/es.js` (app guide texts: `en-guide.js` and `es-guide.js`) |
| Add a palette color token | Every palette in `PALETTES` |
| Add a theme or a language | `PALETTES` in `lib/constants.js`, or a new file in `lib/translations/` added to `COPY` plus `ZODIAC_OPTIONS` in `lib/constants.js`, and the matching list in `lib/config.js` |
| Add a field to Person or Event | The form (`PersonForm` / `EventForm`), `normalizePeople` for defaults and migration, `normalizeForExport` if it is required, display in `PersonCardHeader` / `PersonCardDetails` (person) or `PersonEventList` (event), tests in `lib/__tests__/` |
| Change a partner rule or add a partner field | `lib/partner.js` (validation, import detection, load fallback) with unit tests, `PartnerFields` for the inputs, and `translatePartnerError` plus `COPY` for a new error |
| Add a persisted setting | Default in `DEFAULT_SETTINGS` (`lib/config.js`), state, boot validation, and the save effect in `hooks/usePersistedAppState.js`, the prop wiring in `App.jsx`, and `loadSettings` + `saveSettings` (both native and web branches) in `lib/device-storage.js` |
| Add a statistic | Aggregation function in `lib/stats.js` with unit tests, called from the relevant stats tab (and from `getStatsData` if the PDF should show it); choose `people` vs `eventPeople` deliberately |
| Add a chart type | New generic card in `components/charts/`, wrapped in `FullscreenChartWrapper` |
| Add a screen | New name in `SCREENS` (`lib/constants.js`), its branch in the `screen` conditional in `App.jsx`, `navItems` and `hideBottomBar` if relevant |
| Add an onboarding step | A step component in `components/app/onboarding/`, added to `ONBOARDING_STEPS` in `OnboardingWizard.jsx`; a tour step is a scene list in `onboardingScenes.js`, added as a `{ scenes }` entry |
| Let the onboarding tour point at a new control | `tourTargetProps` and `TapGuide` on the control, a name in `TOUR_TARGETS` when it is not a screen, and a scene in `onboardingScenes.js` |
| Add a section to the app guide | An entry in `APP_GUIDE_SECTIONS` and its texts in every `*-guide.js` file of `lib/translations/` |
| Add a tag list | Its state and persistence like any persisted setting, the merge at boot, a setter in `removeTag` and the `tags` prop in `App.jsx`, an entry in `TAG_FIELDS` (`lib/helpers.js`), and one in `TAG_GROUPS` (`TagsDialog.jsx`) |
| Add a dialog or sheet | Register a close callback on `modalBackRef` while open |
| Add date or age logic | `lib/date.js` with unit tests; never inline date parsing in components |

## Known gaps

These are current facts about the code, listed so they are not mistaken for intended design:

- **PDF export is off.** `FEATURES.pdfExport` is `false` pending a fix to the export; the button in `StatsScreen` is hidden.

