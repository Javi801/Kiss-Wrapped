import { describe, it, expect } from 'vitest'
import { buildImportStatus, skipPartnerIssues, resolvePartnerIssues } from '@/lib/import-people'

const valid = (id) => ({ id, name: `Person ${id}`, partnerStatus: 'never' })
const withIssue = (id) => ({ id, name: `Person ${id}`, partnerStatus: 'ex' })

describe('buildImportStatus', () => {
  describe('invalid content', () => {
    it.each([
      ['an object', { id: 'a' }],
      ['a string', 'people'],
      ['null', null],
      ['an array with a primitive', [valid('a'), 1]],
      ['an array with null', [valid('a'), null]],
      ['an array with a nested array', [valid('a'), []]],
    ])('rejects %s', (_label, parsed) => {
      expect(buildImportStatus(parsed, [])).toEqual({ type: 'error_format' })
    })
  })

  describe('nothing to import', () => {
    it('reports an empty file', () => {
      expect(buildImportStatus([], [])).toEqual({ type: 'empty', totalInFile: 0 })
    })
    it('reports a file where every person is already saved', () => {
      const people = [valid('a'), valid('b')]
      expect(buildImportStatus([valid('a'), valid('b')], people)).toEqual({
        type: 'empty',
        totalInFile: 2,
      })
    })
  })

  describe('people without partner issues', () => {
    it('asks for confirmation with every new person', () => {
      const parsed = [valid('a'), valid('b')]
      expect(buildImportStatus(parsed, [])).toEqual({
        type: 'confirm',
        totalInFile: 2,
        newCount: 2,
        skippedCount: 0,
        data: parsed,
        rows: [],
      })
    })
    it('skips the people whose id is already saved', () => {
      const status = buildImportStatus([valid('a'), valid('b'), valid('c')], [valid('b')])
      expect(status).toMatchObject({
        type: 'confirm',
        totalInFile: 3,
        newCount: 2,
        skippedCount: 1,
      })
      expect(status.data.map((person) => person.id)).toEqual(['a', 'c'])
    })
  })

  describe('people with partner issues', () => {
    it('adds a prefilled row per flagged person', () => {
      const flagged = {
        id: 'b',
        partnerStatus: 'ex',
        partnerFrom: '2020.01.01',
        partnerTo: 'bad',
      }
      const status = buildImportStatus([valid('a'), flagged], [])
      expect(status.type).toBe('partner_issues')
      expect(status.rows).toEqual([
        { index: 1, discarded: false, partnerStatus: '', partnerFrom: '2020.01.01', partnerTo: '' },
      ])
    })
    it('indexes the rows by position among the new people', () => {
      const parsed = [valid('a'), withIssue('b'), valid('c'), withIssue('d')]
      const status = buildImportStatus(parsed, [valid('a')])
      expect(status.data.map((person) => person.id)).toEqual(['b', 'c', 'd'])
      expect(status.rows.map((row) => row.index)).toEqual([0, 2])
    })
    it('ignores the issues of people that are already saved', () => {
      const status = buildImportStatus([withIssue('a'), valid('b')], [valid('a')])
      expect(status.type).toBe('confirm')
      expect(status.rows).toEqual([])
    })
  })
})

describe('skipPartnerIssues', () => {
  it('keeps only the people without a row', () => {
    const importStatus = {
      data: [valid('a'), withIssue('b'), valid('c')],
      rows: [{ index: 1, discarded: false, partnerStatus: '', partnerFrom: '', partnerTo: '' }],
    }
    expect(skipPartnerIssues(importStatus)).toEqual({
      people: [valid('a'), valid('c')],
      status: { type: 'success', newCount: 2, skippedIssueCount: 1 },
    })
  })
  it('skips a row even when it was fixed or discarded', () => {
    const importStatus = {
      data: [withIssue('a'), withIssue('b')],
      rows: [
        { index: 0, discarded: false, partnerStatus: 'never', partnerFrom: '', partnerTo: '' },
        { index: 1, discarded: true, partnerStatus: '', partnerFrom: '', partnerTo: '' },
      ],
    }
    expect(skipPartnerIssues(importStatus)).toEqual({
      people: [],
      status: { type: 'success', newCount: 0, skippedIssueCount: 2 },
    })
  })
})

describe('resolvePartnerIssues', () => {
  it('applies the fixed fields and keeps the file order', () => {
    const importStatus = {
      data: [valid('a'), withIssue('b'), valid('c')],
      rows: [
        {
          index: 1,
          discarded: false,
          partnerStatus: 'past',
          partnerFrom: '2020.01.01',
          partnerTo: '2021.01.01',
        },
      ],
    }
    expect(resolvePartnerIssues(importStatus)).toEqual({
      people: [
        valid('a'),
        {
          id: 'b',
          name: 'Person b',
          partnerStatus: 'past',
          partnerFrom: '2020.01.01',
          partnerTo: '2021.01.01',
        },
        valid('c'),
      ],
      status: { type: 'success', newCount: 3, discardedCount: 0 },
    })
  })
  it('drops the discarded rows and counts them', () => {
    const importStatus = {
      data: [withIssue('a'), valid('b'), withIssue('c')],
      rows: [
        { index: 0, discarded: true, partnerStatus: '', partnerFrom: '', partnerTo: '' },
        { index: 2, discarded: true, partnerStatus: 'never', partnerFrom: '', partnerTo: '' },
      ],
    }
    expect(resolvePartnerIssues(importStatus)).toEqual({
      people: [valid('b')],
      status: { type: 'success', newCount: 1, discardedCount: 2 },
    })
  })
  it.each([
    ['never', { partnerFrom: '', partnerTo: '' }],
    ['current', { partnerFrom: '2020.01.01', partnerTo: '' }],
    ['past', { partnerFrom: '2020.01.01', partnerTo: '2021.01.01' }],
  ])('clears the dates that the status %s does not use', (partnerStatus, expected) => {
    const importStatus = {
      data: [withIssue('a')],
      rows: [
        {
          index: 0,
          discarded: false,
          partnerStatus,
          partnerFrom: '2020.01.01',
          partnerTo: '2021.01.01',
        },
      ],
    }
    expect(resolvePartnerIssues(importStatus).people).toEqual([
      { id: 'a', name: 'Person a', partnerStatus, ...expected },
    ])
  })
})
