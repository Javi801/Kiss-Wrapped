import { existsSync, readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import {
  FEATURES,
  APP_VERSION,
  APP_GITHUB_USER,
  APP_GITHUB_REPO,
  LANGUAGES,
  THEMES,
  ICON_COLORS,
  DEFAULT_SETTINGS,
  LIMITS,
} from '@/lib/config'
import { COPY, PALETTES, ZODIAC_OPTIONS } from '@/lib/constants'
import { ICON_VARIANTS, DEFAULT_ICON_VARIANT } from '@/components/shared/SparkleIcon.constants'

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

  it('keeps onboarding enabled', () => {
    expect(FEATURES.onboarding).toBe(true)
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
    expect([...ICON_COLORS].sort()).toEqual(Object.keys(ICON_VARIANTS).sort())
  })

  it('has a generated in-app image for every icon color', () => {
    for (const { image } of Object.values(ICON_VARIANTS)) {
      expect(existsSync(new URL(`../../assets/icons/${image}`, import.meta.url)), image).toBe(true)
    }
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
    const uncapitalize = (name) => name.charAt(0).toLowerCase() + name.slice(1)
    for (const [, name, icon] of aliases) {
      expect(icon).toBe(ICON_VARIANTS[uncapitalize(name)]?.resource)
    }
    expect(aliases.map(([, name]) => uncapitalize(name)).sort()).toEqual([...ICON_COLORS].sort())
  })

  it('has an adaptive launcher icon for every icon color', () => {
    for (const { resource } of Object.values(ICON_VARIANTS)) {
      const xml = readAndroid(`res/mipmap-anydpi-v26/ic_launcher_${resource}.xml`)
      expect(xml).toContain(`@mipmap/ic_launcher_background_${resource}"`)
      expect(xml).toContain(`@mipmap/ic_launcher_foreground_${resource}"`)
    }
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

  it('uses the icon color of the default launcher icon', () => {
    expect(DEFAULT_SETTINGS.iconColor).toBe(DEFAULT_ICON_VARIANT)
    const [, enabled] = readAndroid('AndroidManifest.xml').match(
      /android:name="\.Alias(\w+)"(?:(?!<\/activity-alias>)[^])*?android:enabled="true"/
    )
    expect(enabled.charAt(0).toLowerCase() + enabled.slice(1)).toBe(DEFAULT_SETTINGS.iconColor)
    const plugin = readAndroid('java/io/kisswrapped/AppIconPlugin.java')
    expect(plugin).toContain(`getString("color", "${DEFAULT_SETTINGS.iconColor}")`)
  })

  it('defines statsVisible as a boolean', () => {
    expect(typeof DEFAULT_SETTINGS.statsVisible).toBe('boolean')
  })

  it('leaves partner-period events out of the statistics', () => {
    expect(DEFAULT_SETTINGS.includePartnerEvents).toBe(false)
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
