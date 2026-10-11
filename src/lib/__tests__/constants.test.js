import { describe, it, expect, afterEach } from 'vitest'
import {
  ACTIVITIES,
  COPY,
  PALETTES,
  SCREENS,
  abbreviateZodiacMonths,
  detectDeviceLanguage,
} from '@/lib/constants'
import { translateActivity } from '@/lib/format'

describe('SCREENS', () => {
  it('names every screen after its key', () => {
    for (const [key, value] of Object.entries(SCREENS)) {
      expect(value).toBe(key)
    }
  })

  it('has no duplicated values', () => {
    const values = Object.values(SCREENS)
    expect(values).not.toHaveLength(0)
    expect(new Set(values).size).toBe(values.length)
  })
})

describe('ACTIVITIES', () => {
  it('has no duplicated values', () => {
    expect(ACTIVITIES).not.toHaveLength(0)
    expect(new Set(ACTIVITIES).size).toBe(ACTIVITIES.length)
  })

  it('has a translation of its own for every activity in every language', () => {
    for (const copy of Object.values(COPY)) {
      const labels = ACTIVITIES.map((activity) => translateActivity(activity, copy))
      for (const label of labels) {
        expect(label).toEqual(expect.any(String))
        expect(label.trim()).not.toBe('')
      }
      // An activity the translation does not handle would repeat the label of 'other'.
      expect(new Set(labels).size).toBe(ACTIVITIES.length)
    }
  })
})

describe('PALETTES', () => {
  it.each(['backdrop', 'topGlow', 'calloutBg', 'calloutShadow', 'shadow', 'shadowStrong'])(
    'defines the color %s in every palette',
    (key) => {
      for (const [theme, palette] of Object.entries(PALETTES)) {
        expect(palette[key], theme).toEqual(expect.any(String))
        expect(palette[key].trim(), theme).not.toBe('')
      }
    }
  )
})

describe('abbreviateZodiacMonths', () => {
  it('abbreviates all twelve English month names', () => {
    const cases = [
      ['January', 'Jan'],
      ['February', 'Feb'],
      ['March', 'Mar'],
      ['April', 'Apr'],
      ['May', 'May'],
      ['June', 'Jun'],
      ['July', 'Jul'],
      ['August', 'Aug'],
      ['September', 'Sep'],
      ['October', 'Oct'],
      ['November', 'Nov'],
      ['December', 'Dec'],
    ]
    for (const [full, abbr] of cases) {
      expect(abbreviateZodiacMonths(full)).toBe(abbr)
    }
  })

  it('abbreviates all twelve Spanish month names', () => {
    const cases = [
      ['enero', 'ene'],
      ['febrero', 'feb'],
      ['marzo', 'mar'],
      ['abril', 'abr'],
      ['mayo', 'may'],
      ['junio', 'jun'],
      ['julio', 'jul'],
      ['agosto', 'ago'],
      ['septiembre', 'sep'],
      ['octubre', 'oct'],
      ['noviembre', 'nov'],
      ['diciembre', 'dic'],
    ]
    for (const [full, abbr] of cases) {
      expect(abbreviateZodiacMonths(full)).toBe(abbr)
    }
  })

  it('abbreviates months inside a full zodiac string', () => {
    expect(abbreviateZodiacMonths('♒ Aquarius (January 20 - February 19)')).toBe(
      '♒ Aquarius (Jan 20 - Feb 19)'
    )
  })

  it('abbreviates multiple months in a single string', () => {
    expect(abbreviateZodiacMonths('January to December')).toBe('Jan to Dec')
  })

  it('leaves strings without month names unchanged', () => {
    expect(abbreviateZodiacMonths('No dates here')).toBe('No dates here')
  })

  it('leaves already abbreviated month names unchanged', () => {
    expect(abbreviateZodiacMonths('Jan 20 - Feb 19')).toBe('Jan 20 - Feb 19')
  })

  it('leaves an empty string unchanged', () => {
    expect(abbreviateZodiacMonths('')).toBe('')
  })
})

describe('detectDeviceLanguage', () => {
  const originalNavigator = globalThis.navigator

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    })
  })

  function setNavigatorLanguage(language, languages) {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language, languages },
      writable: true,
      configurable: true,
    })
  }

  it('returns "es" when navigator.language starts with "es"', () => {
    setNavigatorLanguage('es-CL', ['es-CL'])
    expect(detectDeviceLanguage()).toBe('es')
  })

  it('returns "es" when navigator.language is exactly "es"', () => {
    setNavigatorLanguage('es', ['es'])
    expect(detectDeviceLanguage()).toBe('es')
  })

  it('returns "en" when navigator.language starts with "en"', () => {
    setNavigatorLanguage('en-US', ['en-US'])
    expect(detectDeviceLanguage()).toBe('en')
  })

  it('returns "en" for any non-Spanish language', () => {
    setNavigatorLanguage('fr-FR', ['fr-FR'])
    expect(detectDeviceLanguage()).toBe('en')
  })

  it('falls back to navigator.languages[0] when navigator.language is empty', () => {
    setNavigatorLanguage('', ['es-AR'])
    expect(detectDeviceLanguage()).toBe('es')
  })

  it('returns "en" when navigator is undefined', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: undefined,
      writable: true,
      configurable: true,
    })
    expect(detectDeviceLanguage()).toBe('en')
  })
})

describe('COPY', () => {
  it('has the same keys in every language', () => {
    const keys = Object.keys(COPY.en).sort()
    for (const copy of Object.values(COPY)) {
      expect(Object.keys(copy).sort()).toEqual(keys)
    }
  })

  it.each([
    'importJsonSuccessSkipped',
    'importJsonSuccessDiscarded',
    'importPartnerIssuesTitle',
    'importPartnerIssuesCount',
    'importPartnerFix',
    'importPartnerSkipAction',
    'importPartnerEventsHeader',
    'importPartnerDiscard',
    'importPartnerLeftToResolve',
    'importPartnerSummaryDiscard',
    'importPartnerNothingToImport',
    'requiredPartnerStatus',
  ])('has the partner import text %s in every language', (key) => {
    for (const copy of Object.values(COPY)) {
      expect(copy[key]).toEqual(expect.any(String))
      expect(copy[key].trim()).not.toBe('')
    }
  })

  it.each([
    'onboardingDoneTitle',
    'onboardingDoneBody',
    'onboardingDoneAction',
    'restartOnboarding',
  ])('has the onboarding text %s in every language', (key) => {
    for (const copy of Object.values(COPY)) {
      expect(copy[key]).toEqual(expect.any(String))
      expect(copy[key].trim()).not.toBe('')
    }
  })

  it.each(['tutorialDoneTitle', 'tutorialDoneBody', 'tutorialDoneAction', 'restartTutorial'])(
    'no longer has the renamed text %s',
    (key) => {
      for (const copy of Object.values(COPY)) {
        expect(copy).not.toHaveProperty(key)
      }
    }
  )
})
