import { describe, it, expect, afterEach } from 'vitest'
import { abbreviateZodiacMonths, detectDeviceLanguage } from '@/lib/constants'

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
