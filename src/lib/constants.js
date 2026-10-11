import { en } from '@/lib/translations/en'
import { es } from '@/lib/translations/es'

/**
 * Storage keys used to persist app state.
 * Keep these values unchanged to preserve compatibility
 * with existing saved data across app versions.
 */
export const STORAGE_KEY = 'kiss-wrapped-local-v3'
export const LANGUAGE_KEY = 'kiss-wrapped-language-local-v3'
export const ICON_COLOR_KEY = 'kiss-wrapped-icon-color-v1'
export const THEME_KEY = 'kiss-wrapped-theme-v1'
export const STATS_VISIBLE_KEY = 'kiss-wrapped-stats-visible-v1'
export const INCLUDE_PARTNER_EVENTS_KEY = 'kiss-wrapped-include-partner-events-v1'
export const SITUATION_TAGS_KEY = 'kiss-wrapped-situation-tags-v1'
export const PLACE_TAGS_KEY = 'kiss-wrapped-place-tags-v1'
export const HOW_WE_MET_TAGS_KEY = 'kiss-wrapped-how-we-met-tags-v1'
export const ONBOARDING_DONE_KEY = 'kiss-wrapped-onboarding-done-v1'
export const PEOPLE_FILE_NAME = 'kiss-wrapped-people.json'
export const SETTINGS_FILE_NAME = 'kiss-wrapped-settings.json'

// Screen names the app navigates between.
export const SCREENS = {
  boot: 'boot',
  intro: 'intro',
  main: 'main',
  add: 'add',
  people: 'people',
  stats: 'stats',
  onboarding: 'onboarding',
}

// Reusable option lists used across forms and analytics.
export const GENDERS = ['male', 'female', 'other']
export const SCORE_OPTIONS = [0, 1, 2, 3, 4, 5]
export const ACTIVITIES = ['studies', 'works', 'studies and works', 'other']

// All available UI themes.
export const PALETTES = {
  pink: {
    bg: '#fff8fb',
    bgSoft: '#fff3f8',
    bgGradientFrom: '#ffddea',
    bgGradientVia: '#f8abc7',
    bgGradientTo: '#bde0fe',
    card: '#ffffff',
    cardSoft: '#fff7fb',
    accent: '#e27396',
    accentSoft: '#f8abc7',
    accentMuted: '#ffddea',
    gradientEnd: '#bde0fe',
    accent2: '#a2d2ff',
    mint: '#eaf2d7',
    aqua: '#b3dee2',
    gradientMid: '#e9d1f0',
    emphasisEnd: '#cdb4db',
    accentEmphasis: '#880d1e',
    accentEmphasis2: '#3c096c',
    navy: '#3b3b6d',
    line: '#ead7e2',
    text: '#43384a',
    textSoft: '#6b6270',
    textOnAccent: '#ffffff',
    watermark: '#4f4656',
    watermarkOpacity: 0.5,
    inputBorder: '#ecd6e0',
    cardBorder: '#f1dde7',
    innerCardBorder: '#efdee6',
    inputBg: 'rgba(255,255,255,0.88)',
    controlBg: 'rgba(255,255,255,0.86)',
    cardBg: 'rgba(255,255,255,0.82)',
    surfaceBg: 'rgba(255,255,255,0.78)',
    navBarBg: 'rgba(255,255,255,0.8)',
    accentShadow: 'rgba(226,115,150,0.2)',
    accentGlow: 'rgba(226,115,150,0.35)',
    backdrop: 'rgba(24,14,34,0.6)',
    topGlow: 'rgba(255,255,255,0.95)',
    calloutBg: 'rgba(255,255,255,0.92)',
    calloutShadow: 'rgba(55,36,61,0.16)',
    shadow: 'rgba(0,0,0,0.12)',
    shadowStrong: 'rgba(0,0,0,0.16)',
    danger: '#ef4444',
    dangerEmphasis: '#dc2626',
    warningBorder: '#f9d58a',
    warningBadgeBg: '#fef3c7',
    warningBadgeText: '#b45309',
    isDark: false,
    chartColors: [
      '#e27396',
      '#6ab5e8',
      '#42c0a8',
      '#f0a850',
      '#a07ad0',
      '#72bb80',
      '#e8826a',
      '#c472c8',
    ],
    chartHeatmapRgb: '226, 115, 150',
  },
  green: {
    bg: '#f6fbf8',
    bgSoft: '#eef8f2',
    bgGradientFrom: '#d4edda',
    bgGradientVia: '#a8d5b5',
    bgGradientTo: '#bde0fe',
    card: '#ffffff',
    cardSoft: '#f0fbf4',
    accent: '#5a9e72',
    accentSoft: '#90c7a4',
    accentMuted: '#d4edda',
    gradientEnd: '#bde0fe',
    accent2: '#a2d2ff',
    mint: '#eaf2d7',
    aqua: '#b3dee2',
    gradientMid: '#eff2d7',
    emphasisEnd: '#cdb4db',
    accentEmphasis: '#1a4a2c',
    accentEmphasis2: '#0d3320',
    navy: '#1a3a28',
    line: '#c8e6d0',
    text: '#2a3d2f',
    textSoft: '#4a6a55',
    textOnAccent: '#ffffff',
    watermark: '#35513f',
    watermarkOpacity: 0.5,
    inputBorder: '#c8e6d0',
    cardBorder: '#d4edda',
    innerCardBorder: '#c8e6d0',
    inputBg: 'rgba(255,255,255,0.88)',
    controlBg: 'rgba(255,255,255,0.86)',
    cardBg: 'rgba(255,255,255,0.82)',
    surfaceBg: 'rgba(255,255,255,0.78)',
    navBarBg: 'rgba(255,255,255,0.8)',
    accentShadow: 'rgba(90,158,114,0.2)',
    accentGlow: 'rgba(90,158,114,0.35)',
    backdrop: 'rgba(24,14,34,0.6)',
    topGlow: 'rgba(255,255,255,0.95)',
    calloutBg: 'rgba(255,255,255,0.92)',
    calloutShadow: 'rgba(55,36,61,0.16)',
    shadow: 'rgba(0,0,0,0.12)',
    shadowStrong: 'rgba(0,0,0,0.16)',
    danger: '#ef4444',
    dangerEmphasis: '#dc2626',
    warningBorder: '#f9d58a',
    warningBadgeBg: '#fef3c7',
    warningBadgeText: '#b45309',
    isDark: false,
    chartColors: [
      '#5a9e72',
      '#e06878',
      '#88c5db',
      '#d7c16a',
      '#6f79d0',
      '#b08bd8',
      '#f2a65a',
      '#d860c0',
    ],
    chartHeatmapRgb: '46, 125, 80',
    chartHeatmapAlphaBase: 0.12,
    chartHeatmapExponent: 1.45,
  },
  dark: {
    bg: '#0f0d1a',
    bgSoft: '#14112a',
    bgGradientFrom: '#1a1535',
    bgGradientVia: '#1e2d5a',
    bgGradientTo: '#0f1e3d',
    card: '#1a1535',
    cardSoft: '#1e1a3a',
    accent: '#8b7cf8',
    accentSoft: '#b4acfa',
    accentMuted: '#2d2852',
    gradientEnd: '#4a7cd4',
    accent2: '#6b9de8',
    mint: '#1e3a4a',
    aqua: '#2d5a7a',
    gradientMid: '#3d2d6a',
    emphasisEnd: '#5d4d9a',
    accentEmphasis: '#c7c2ff',
    accentEmphasis2: '#8b7cf8',
    navy: '#0a0d2a',
    line: '#2d2852',
    text: '#e8e3ff',
    textSoft: '#9d97c5',
    textOnAccent: '#ffffff',
    watermark: '#9d97c5',
    watermarkOpacity: 0.55,
    inputBorder: '#2d2852',
    cardBorder: '#2d2852',
    innerCardBorder: '#261f4a',
    inputBg: 'rgba(20,17,42,0.88)',
    controlBg: 'rgba(20,17,42,0.86)',
    cardBg: 'rgba(20,17,42,0.82)',
    surfaceBg: 'rgba(20,17,42,0.78)',
    navBarBg: 'rgba(15,13,26,0.85)',
    accentShadow: 'rgba(139,124,248,0.2)',
    accentGlow: 'rgba(139,124,248,0.35)',
    backdrop: 'rgba(24,14,34,0.6)',
    topGlow: 'rgba(255,255,255,0.95)',
    calloutBg: '#1a1535',
    calloutShadow: 'rgba(55,36,61,0.16)',
    shadow: 'rgba(0,0,0,0.12)',
    shadowStrong: 'rgba(0,0,0,0.16)',
    danger: '#f87171',
    dangerEmphasis: '#ef4444',
    warningBorder: '#f9d58a',
    warningBadgeBg: '#78350f',
    warningBadgeText: '#fcd34d',
    isDark: true,
    chartColors: [
      '#8b7cf8',
      '#4a9fe8',
      '#3fb6b2',
      '#d6a657',
      '#c084fc',
      '#f472b6',
      '#7dd3fc',
      '#a3e635',
    ],
    chartHeatmapRgb: '167, 139, 250',
    chartHeatmapAlphaBase: 0.14,
    chartHeatmapExponent: 1.5,
  },
}

// Default palette alias kept for non-React modules (e.g. pdf-export.js).
export const PALETTE = PALETTES.pink

// Semantic text scale. Spread into style objects or use directly as style prop.
export const TEXT = {
  caption: { fontSize: '0.75rem', lineHeight: '1rem' },
  label: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '600' },
  input: { fontSize: '0.8rem' },
  body: { fontSize: '0.875rem', lineHeight: '1.25rem' },
  bodyStrong: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '600' },
  base: { fontSize: '1rem', lineHeight: '1.5rem' },
  title: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '600' },
  subheading: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: '700' },
  heading: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '700' },
}

// Generic colors for graphics.
export const CHART_COLORS = [
  '#e27396',
  '#6ab5e8',
  '#42c0a8',
  '#f0a850',
  '#a07ad0',
  '#72bb80',
  '#e8826a',
  '#c472c8',
]

// Gender-specific colors.
export const GENDER_COLORS = {
  male: '#7aa7ff',
  female: '#e27396',
  other: '#8fc9b5',
}

const MONTH_ABBR = {
  January: 'Jan',
  February: 'Feb',
  March: 'Mar',
  April: 'Apr',
  May: 'May',
  June: 'Jun',
  July: 'Jul',
  August: 'Aug',
  September: 'Sep',
  October: 'Oct',
  November: 'Nov',
  December: 'Dec',
  enero: 'ene',
  febrero: 'feb',
  marzo: 'mar',
  abril: 'abr',
  mayo: 'may',
  junio: 'jun',
  julio: 'jul',
  agosto: 'ago',
  septiembre: 'sep',
  octubre: 'oct',
  noviembre: 'nov',
  diciembre: 'dic',
}

export function abbreviateZodiacMonths(zodiacString) {
  return zodiacString.replace(
    /January|February|March|April|May|June|July|August|September|October|November|December|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/g,
    (m) => MONTH_ABBR[m]
  )
}

// Zodiac sign options by language. Aquarius
export const ZODIAC_OPTIONS = {
  en: [
    '♒ Aquarius (January 20 - February 19)',
    '♓ Pisces (February 20 - March 20)',
    '♈ Aries (March 21 - April 19)',
    '♉ Taurus (April 20 - May 20)',
    '♊ Gemini (May 21 - June 20)',
    '♋ Cancer (June 21 - July 22)',
    '♌ Leo (July 23 - August 23)',
    '♍ Virgo (August 24 - September 22)',
    '♎ Libra (September 23 - October 22)',
    '♏ Scorpio (October 23 - November 21)',
    '♐ Sagittarius (November 22 - December 21)',
    '♑ Capricorn (December 22 - January 19)',
  ],
  es: [
    '♒ Acuario (20 enero - 19 febrero)',
    '♓ Piscis (20 febrero - 20 marzo)',
    '♈ Aries (21 marzo - 19 abril)',
    '♉ Tauro (20 abril - 20 mayo)',
    '♊ Géminis (21 mayo - 20 junio)',
    '♋ Cáncer (21 junio - 22 julio)',
    '♌ Leo (23 julio - 23 agosto)',
    '♍ Virgo (24 agosto - 22 septiembre)',
    '♎ Libra (23 septiembre - 22 octubre)',
    '♏ Escorpio (23 octubre - 21 noviembre)',
    '♐ Sagitario (22 noviembre - 21 diciembre)',
    '♑ Capricornio (22 diciembre - 19 enero)',
  ],
}

/**
 * Detects the device/browser language and maps it to a supported app language.
 * Returns "es" if the primary language starts with "es", otherwise "en".
 */
export function detectDeviceLanguage() {
  const lang =
    (typeof navigator !== 'undefined' &&
      (navigator.language || (navigator.languages && navigator.languages[0]))) ||
    'en'
  return lang.startsWith('es') ? 'es' : 'en'
}

// List of texts in the app, organized by language.
export const COPY = { en, es }
