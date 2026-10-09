import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import {
  FEATURES,
  APP_VERSION,
  APP_GITHUB_USER,
  APP_GITHUB_REPO,
  ONBOARDING_VERSION,
  LANGUAGES,
  THEMES,
  ICON_COLORS,
  DEFAULT_SETTINGS,
  LIMITS,
} from '@/lib/config'
import { COPY, PALETTES, ZODIAC_OPTIONS } from '@/lib/constants'
import { SPARKLE_PALETTES, PALETTE_SWATCHES } from '@/components/shared/SparkleIcon.constants'

const ANDROID_MAIN = new URL('../../../android/app/src/main/', import.meta.url)
const readAndroid = (path) => readFileSync(new URL(path, ANDROID_MAIN), 'utf8')

describe('FEATURES', () => {
  it('defines every flag as a boolean', () => {
    for (const [name, value] of Object.entries(FEATURES)) {
      expect(typeof value, name).toBe('boolean')
    }
  })

  // Update these when a feature is intentionally released.
  it('keeps PDF export disabled', () => {
    expect(FEATURES.pdfExport).toBe(false)
  })

  it('keeps onboarding disabled', () => {
    expect(FEATURES.onboarding).toBe(false)
  })
})

describe('app metadata', () => {
  it('defines a non-empty version and GitHub user', () => {
    expect(APP_VERSION).toEqual(expect.any(String))
    expect(APP_VERSION).not.toBe('')
    expect(APP_GITHUB_USER).toEqual(expect.any(String))
    expect(APP_GITHUB_USER).not.toBe('')
  })

  it('points the repo link to the GitHub user over https', () => {
    expect(APP_GITHUB_REPO.startsWith(`https://github.com/${APP_GITHUB_USER}/`)).toBe(true)
  })

  it('defines the onboarding version as a positive integer', () => {
    expect(Number.isInteger(ONBOARDING_VERSION)).toBe(true)
    expect(ONBOARDING_VERSION).toBeGreaterThan(0)
  })
})

describe('supported setting values', () => {
  it('lists exactly the languages that have translations', () => {
    expect([...LANGUAGES].sort()).toEqual(Object.keys(COPY).sort())
  })

  it('lists exactly the languages that have zodiac options', () => {
    expect([...LANGUAGES].sort()).toEqual(Object.keys(ZODIAC_OPTIONS).sort())
  })

  it('lists exactly the themes that have a palette', () => {
    expect([...THEMES].sort()).toEqual(Object.keys(PALETTES).sort())
  })

  it('lists exactly the icon colors the icon component can draw', () => {
    expect([...ICON_COLORS].sort()).toEqual(Object.keys(SPARKLE_PALETTES).sort())
    expect([...ICON_COLORS].sort()).toEqual(Object.keys(PALETTE_SWATCHES).sort())
  })

  it('lists exactly the icon colors the Android plugin accepts', () => {
    const [, list] = readAndroid('java/io/kisswrapped/AppIconPlugin.java').match(
      /COLORS = Arrays\.asList\(([^)]*)\)/
    )
    const colors = [...list.matchAll(/"(\w+)"/g)].map(([, color]) => color)
    expect(colors.sort()).toEqual([...ICON_COLORS].sort())
  })

  it('lists exactly the icon colors that have a launcher alias', () => {
    const aliases = [
      ...readAndroid('AndroidManifest.xml').matchAll(
        /<activity-alias\s+android:name="\.Alias(\w+)"[^>]*android:icon="@mipmap\/ic_launcher_(\w+)"/g
      ),
    ]
    for (const [, name, icon] of aliases) expect(icon).toBe(name.toLowerCase())
    expect(aliases.map(([, name]) => name.toLowerCase()).sort()).toEqual([...ICON_COLORS].sort())
  })

  it('has no duplicated values', () => {
    for (const list of [LANGUAGES, THEMES, ICON_COLORS]) {
      expect(new Set(list).size).toBe(list.length)
    }
  })
})

describe('DEFAULT_SETTINGS', () => {
  it('uses a supported language', () => {
    expect(LANGUAGES).toContain(DEFAULT_SETTINGS.language)
  })

  it('uses a supported theme', () => {
    expect(THEMES).toContain(DEFAULT_SETTINGS.theme)
  })

  it('uses a supported icon color', () => {
    expect(ICON_COLORS).toContain(DEFAULT_SETTINGS.iconColor)
  })

  it('defines statsVisible as a boolean', () => {
    expect(typeof DEFAULT_SETTINGS.statsVisible).toBe('boolean')
  })
})

describe('LIMITS', () => {
  it('defines every limit as a positive integer', () => {
    for (const [name, value] of Object.entries(LIMITS)) {
      expect(Number.isInteger(value), name).toBe(true)
      expect(value, name).toBeGreaterThan(0)
    }
  })
})
