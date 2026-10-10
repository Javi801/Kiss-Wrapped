import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  PARTNER_STATUSES,
  PARTNER_ERRORS,
  resolvePartnerStatus,
  validatePartnerFields,
  hasPartnerIssues,
  prefillPartnerFields,
  sanitizePartnerFields,
} from '@/lib/partner'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2024-06-15T12:00:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('PARTNER_STATUSES', () => {
  it('lists the three statuses', () => {
    expect(PARTNER_STATUSES).toEqual(['never', 'current', 'past'])
  })
})

describe('resolvePartnerStatus', () => {
  it.each(PARTNER_STATUSES)('keeps the known status %s', (partnerStatus) => {
    expect(resolvePartnerStatus({ partnerStatus })).toBe(partnerStatus)
  })
  it('keeps a known status over the legacy isPartner flag', () => {
    expect(resolvePartnerStatus({ partnerStatus: 'never', isPartner: true })).toBe('never')
  })
  it('migrates legacy isPartner: true to current', () => {
    expect(resolvePartnerStatus({ isPartner: true })).toBe('current')
  })
  it('migrates legacy isPartner: false to never', () => {
    expect(resolvePartnerStatus({ isPartner: false })).toBe('never')
  })
  it('defaults to never when both fields are absent', () => {
    expect(resolvePartnerStatus({})).toBe('never')
  })
  it('resolves an unknown status to never', () => {
    expect(resolvePartnerStatus({ partnerStatus: 'ex' })).toBe('never')
  })
  it('resolves an unknown status to current with isPartner: true', () => {
    expect(resolvePartnerStatus({ partnerStatus: 'ex', isPartner: true })).toBe('current')
  })
  it('ignores a truthy isPartner that is not true', () => {
    expect(resolvePartnerStatus({ isPartner: 'yes' })).toBe('never')
  })
})

describe('validatePartnerFields', () => {
  const validate = (partnerStatus, partnerFrom = '', partnerTo = '') =>
    validatePartnerFields({ partnerStatus, partnerFrom, partnerTo })

  describe('status', () => {
    it.each(['', 'ex', undefined, null])('reports the unknown status %s', (partnerStatus) => {
      expect(validate(partnerStatus)).toEqual({ status: PARTNER_ERRORS.unknownStatus })
    })
    it('does not check the dates of an unknown status', () => {
      expect(validate('ex', 'bad', 'bad')).toEqual({ status: PARTNER_ERRORS.unknownStatus })
    })
  })

  describe('never', () => {
    it('is valid without dates', () => {
      expect(validate('never')).toEqual({})
    })
    it('ignores both dates', () => {
      expect(validate('never', 'bad', '2999.01.01')).toEqual({})
    })
  })

  describe('current', () => {
    it('is valid without a start', () => {
      expect(validate('current')).toEqual({})
    })
    it('is valid with a past start', () => {
      expect(validate('current', '2020.01.01')).toEqual({})
    })
    it('accepts today as the start', () => {
      expect(validate('current', '2024.06.15')).toEqual({})
    })
    it('reports a start in another format', () => {
      expect(validate('current', '2020-01-01')).toEqual({
        partnerFrom: PARTNER_ERRORS.invalidDate,
      })
    })
    it('reports a start that is not a real date', () => {
      expect(validate('current', '2023.02.30')).toEqual({
        partnerFrom: PARTNER_ERRORS.invalidDate,
      })
    })
    it('reports a start that is not trimmed', () => {
      expect(validate('current', ' 2020.01.01 ')).toEqual({
        partnerFrom: PARTNER_ERRORS.invalidDate,
      })
    })
    it('reports a future start', () => {
      expect(validate('current', '2024.06.16')).toEqual({
        partnerFrom: PARTNER_ERRORS.futureDate,
      })
    })
    it('ignores the end', () => {
      expect(validate('current', '2020.01.01', 'bad')).toEqual({})
    })
  })

  describe('past', () => {
    it('is valid with only an end', () => {
      expect(validate('past', '', '2021.01.01')).toEqual({})
    })
    it('is valid with a start before the end', () => {
      expect(validate('past', '2020.01.01', '2021.01.01')).toEqual({})
    })
    it('is valid when the start equals the end', () => {
      expect(validate('past', '2021.01.01', '2021.01.01')).toEqual({})
    })
    it.each(['', undefined, null])('reports the missing end %s', (partnerTo) => {
      expect(validate('past', '2020.01.01', partnerTo)).toEqual({
        partnerTo: PARTNER_ERRORS.missingEnd,
      })
    })
    it('reports an invalid end', () => {
      expect(validate('past', '', '01/01/2021')).toEqual({
        partnerTo: PARTNER_ERRORS.invalidDate,
      })
    })
    it('reports a future end', () => {
      expect(validate('past', '', '2024.06.16')).toEqual({
        partnerTo: PARTNER_ERRORS.futureDate,
      })
    })
    it('reports an inverted range on the end', () => {
      expect(validate('past', '2022.01.01', '2021.01.01')).toEqual({
        partnerTo: PARTNER_ERRORS.invertedRange,
      })
    })
    it('reports both dates when both are invalid', () => {
      expect(validate('past', 'bad', 'bad')).toEqual({
        partnerFrom: PARTNER_ERRORS.invalidDate,
        partnerTo: PARTNER_ERRORS.invalidDate,
      })
    })
    it('does not compare the range when the start is invalid', () => {
      expect(validate('past', 'zzzz', '2021.01.01')).toEqual({
        partnerFrom: PARTNER_ERRORS.invalidDate,
      })
    })
    it('does not compare the range when the start is in the future', () => {
      expect(validate('past', '2024.07.01', '2021.01.01')).toEqual({
        partnerFrom: PARTNER_ERRORS.futureDate,
      })
    })
  })

  describe('non-string dates', () => {
    it.each([20200101, 0, false, true, {}, ['2020.01.01']])('reports the start %j', (value) => {
      expect(validate('current', value)).toEqual({ partnerFrom: PARTNER_ERRORS.invalidDate })
    })
    it.each([20210101, 0, false, {}, ['2021.01.01']])('reports the end %j', (value) => {
      expect(validate('past', '', value)).toEqual({ partnerTo: PARTNER_ERRORS.invalidDate })
    })
    it.each([undefined, null])('treats the start %s as empty', (value) => {
      expect(validate('current', value)).toEqual({})
    })
  })
})

describe('hasPartnerIssues', () => {
  describe('without issues', () => {
    it.each([
      ['no partner fields', {}],
      ['never with empty dates', { partnerStatus: 'never', partnerFrom: '', partnerTo: '' }],
      ['current without a start', { partnerStatus: 'current', partnerFrom: '', partnerTo: '' }],
      ['current with a start', { partnerStatus: 'current', partnerFrom: '2020.01.01' }],
      [
        'past with only an end',
        { partnerStatus: 'past', partnerFrom: '', partnerTo: '2021.01.01' },
      ],
      [
        'past with a full range',
        { partnerStatus: 'past', partnerFrom: '2020.01.01', partnerTo: '2021.01.01' },
      ],
      ['legacy isPartner: true', { isPartner: true }],
      ['legacy isPartner: false', { isPartner: false }],
      ['legacy isPartner with a start', { isPartner: true, partnerFrom: '2020.01.01' }],
      ['a null status', { partnerStatus: null, isPartner: true }],
      ['null dates', { partnerStatus: 'past', partnerFrom: null, partnerTo: '2021.01.01' }],
      ['dates the status does not use', { partnerStatus: 'never', partnerFrom: 'bad' }],
      ['an end on a current partner', { partnerStatus: 'current', partnerTo: 'bad' }],
    ])('%s', (_label, rawPerson) => {
      expect(hasPartnerIssues(rawPerson)).toBe(false)
    })
  })

  describe('with issues', () => {
    it.each([
      ['an unknown status', { partnerStatus: 'ex' }],
      ['an unknown status with isPartner', { partnerStatus: 'ex', isPartner: true }],
      ['an empty status', { partnerStatus: '' }],
      ['a non-string status', { partnerStatus: 1 }],
      ['a start in another format', { partnerStatus: 'current', partnerFrom: '2020-01-01' }],
      ['a non-string start', { partnerStatus: 'current', partnerFrom: 20200101 }],
      ['an invalid legacy start', { isPartner: true, partnerFrom: 'bad' }],
      ['a future start', { partnerStatus: 'current', partnerFrom: '2024.06.16' }],
      ['past without an end', { partnerStatus: 'past', partnerFrom: '2020.01.01' }],
      ['past with an empty end', { partnerStatus: 'past', partnerFrom: '', partnerTo: '' }],
      ['an invalid end', { partnerStatus: 'past', partnerTo: 'bad' }],
      ['a non-string end', { partnerStatus: 'past', partnerTo: 20210101 }],
      ['a future end', { partnerStatus: 'past', partnerTo: '2024.06.16' }],
      [
        'an inverted range',
        { partnerStatus: 'past', partnerFrom: '2022.01.01', partnerTo: '2021.01.01' },
      ],
    ])('%s', (_label, rawPerson) => {
      expect(hasPartnerIssues(rawPerson)).toBe(true)
    })
  })
})

describe('prefillPartnerFields', () => {
  it('keeps valid data', () => {
    const fields = { partnerStatus: 'past', partnerFrom: '2020.01.01', partnerTo: '2021.01.01' }
    expect(prefillPartnerFields(fields)).toEqual(fields)
  })
  it.each(['ex', '', 1])('leaves the unknown status %j empty', (partnerStatus) => {
    expect(prefillPartnerFields({ partnerStatus, isPartner: true }).partnerStatus).toBe('')
  })
  it('resolves an absent status through the legacy isPartner flag', () => {
    expect(prefillPartnerFields({ isPartner: true }).partnerStatus).toBe('current')
    expect(prefillPartnerFields({}).partnerStatus).toBe('never')
  })
  it.each(['2020-01-01', '2023.02.30', 20200101, null, undefined])(
    'empties the invalid date %j',
    (value) => {
      expect(
        prefillPartnerFields({ partnerStatus: 'past', partnerFrom: value, partnerTo: value })
      ).toEqual({ partnerStatus: 'past', partnerFrom: '', partnerTo: '' })
    }
  )
  it('keeps the dates of an inverted range', () => {
    const fields = { partnerStatus: 'past', partnerFrom: '2022.01.01', partnerTo: '2021.01.01' }
    expect(prefillPartnerFields(fields)).toEqual(fields)
  })
  it('keeps a future date so its error is shown', () => {
    expect(prefillPartnerFields({ partnerStatus: 'current', partnerFrom: '2024.06.16' })).toEqual({
      partnerStatus: 'current',
      partnerFrom: '2024.06.16',
      partnerTo: '',
    })
  })
  it('keeps valid dates next to an unknown status', () => {
    expect(
      prefillPartnerFields({
        partnerStatus: 'ex',
        partnerFrom: '2020.01.01',
        partnerTo: '2021.01.01',
      })
    ).toEqual({ partnerStatus: '', partnerFrom: '2020.01.01', partnerTo: '2021.01.01' })
  })
})

describe('sanitizePartnerFields', () => {
  it('keeps valid past data', () => {
    const fields = { partnerStatus: 'past', partnerFrom: '2020.01.01', partnerTo: '2021.01.01' }
    expect(sanitizePartnerFields(fields)).toEqual(fields)
  })
  it('keeps valid current data', () => {
    expect(sanitizePartnerFields({ partnerStatus: 'current', partnerFrom: '2020.01.01' })).toEqual({
      partnerStatus: 'current',
      partnerFrom: '2020.01.01',
      partnerTo: '',
    })
  })
  it('returns only the partner fields', () => {
    expect(Object.keys(sanitizePartnerFields({ id: 'a', name: 'Ana', isPartner: true }))).toEqual([
      'partnerStatus',
      'partnerFrom',
      'partnerTo',
    ])
  })
  it('migrates the legacy isPartner flag', () => {
    expect(sanitizePartnerFields({ isPartner: true, partnerFrom: '2020.01.01' })).toEqual({
      partnerStatus: 'current',
      partnerFrom: '2020.01.01',
      partnerTo: '',
    })
  })
  it('resolves an unknown status to never and clears the dates', () => {
    expect(
      sanitizePartnerFields({
        partnerStatus: 'ex',
        partnerFrom: '2020.01.01',
        partnerTo: '2021.01.01',
      })
    ).toEqual({ partnerStatus: 'never', partnerFrom: '', partnerTo: '' })
  })
  it('resolves an unknown status to current with isPartner: true', () => {
    expect(
      sanitizePartnerFields({ partnerStatus: 'ex', isPartner: true, partnerFrom: '2020.01.01' })
    ).toEqual({ partnerStatus: 'current', partnerFrom: '2020.01.01', partnerTo: '' })
  })
  it('clears the dates of a never partner', () => {
    expect(
      sanitizePartnerFields({
        partnerStatus: 'never',
        partnerFrom: '2020.01.01',
        partnerTo: '2021.01.01',
      })
    ).toEqual({ partnerStatus: 'never', partnerFrom: '', partnerTo: '' })
  })
  it('clears the end of a current partner', () => {
    expect(
      sanitizePartnerFields({
        partnerStatus: 'current',
        partnerFrom: '2020.01.01',
        partnerTo: '2021.01.01',
      })
    ).toEqual({ partnerStatus: 'current', partnerFrom: '2020.01.01', partnerTo: '' })
  })
  it.each(['2020-01-01', '2023.02.30', ' 2020.01.01', 20200101, null, undefined, {}])(
    'clears the invalid start %j',
    (partnerFrom) => {
      expect(sanitizePartnerFields({ partnerStatus: 'current', partnerFrom })).toEqual({
        partnerStatus: 'current',
        partnerFrom: '',
        partnerTo: '',
      })
    }
  )
  it('clears an invalid start and keeps the end', () => {
    expect(
      sanitizePartnerFields({ partnerStatus: 'past', partnerFrom: 'bad', partnerTo: '2021.01.01' })
    ).toEqual({ partnerStatus: 'past', partnerFrom: '', partnerTo: '2021.01.01' })
  })
  it('drops the start of an inverted range and keeps the end', () => {
    expect(
      sanitizePartnerFields({
        partnerStatus: 'past',
        partnerFrom: '2022.01.01',
        partnerTo: '2021.01.01',
      })
    ).toEqual({ partnerStatus: 'past', partnerFrom: '', partnerTo: '2021.01.01' })
  })
  it.each(['', 'bad', 20210101, null, undefined])(
    'turns past with the end %j into never',
    (partnerTo) => {
      expect(
        sanitizePartnerFields({ partnerStatus: 'past', partnerFrom: '2020.01.01', partnerTo })
      ).toEqual({ partnerStatus: 'never', partnerFrom: '', partnerTo: '' })
    }
  )
  it('keeps future dates', () => {
    expect(
      sanitizePartnerFields({
        partnerStatus: 'past',
        partnerFrom: '2030.01.01',
        partnerTo: '2031.01.01',
      })
    ).toEqual({ partnerStatus: 'past', partnerFrom: '2030.01.01', partnerTo: '2031.01.01' })
  })
  it('is a no-op on its own output', () => {
    const once = sanitizePartnerFields({
      partnerStatus: 'past',
      partnerFrom: '2022.01.01',
      partnerTo: '2021.01.01',
    })
    expect(sanitizePartnerFields(once)).toEqual(once)
  })
})
