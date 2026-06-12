import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('ignores undefined and null values', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b')
  })

  it('resolves tailwind conflicts by keeping the last value', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('returns an empty string for no arguments', () => {
    expect(cn()).toBe('')
  })

  it('includes class from a truthy conditional object', () => {
    expect(cn({ 'bg-red-500': true, 'bg-blue-500': false })).toBe('bg-red-500')
  })

  it('handles array inputs', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })

  it('ignores false and zero in conditional object', () => {
    expect(cn({ hidden: false, visible: true })).toBe('visible')
  })
})
