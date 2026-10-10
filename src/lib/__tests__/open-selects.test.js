import { describe, it, expect, vi, afterEach } from 'vitest'
import { registerOpenSelect, closeTopSelect } from '@/lib/open-selects'

// The registry is module state, so every test unregisters what it registered.
const cleanups = []
function register(close) {
  const unregister = registerOpenSelect(close)
  cleanups.push(unregister)
  return unregister
}

afterEach(() => {
  cleanups.splice(0).forEach((unregister) => unregister())
})

describe('closeTopSelect', () => {
  it('returns false when no select is open', () => {
    expect(closeTopSelect()).toBe(false)
  })

  it('calls the close callback of the open select and returns true', () => {
    const close = vi.fn()
    register(close)
    expect(closeTopSelect()).toBe(true)
    expect(close).toHaveBeenCalledOnce()
  })

  it('closes only the most recently opened select', () => {
    const first = vi.fn()
    const second = vi.fn()
    register(first)
    register(second)
    expect(closeTopSelect()).toBe(true)
    expect(second).toHaveBeenCalledOnce()
    expect(first).not.toHaveBeenCalled()
  })

  it('keeps a select registered until it unregisters itself', () => {
    const close = vi.fn()
    register(close)
    closeTopSelect()
    closeTopSelect()
    expect(close).toHaveBeenCalledTimes(2)
  })
})

describe('registerOpenSelect', () => {
  it('returns a function that unregisters the select', () => {
    const close = vi.fn()
    const unregister = register(close)
    unregister()
    expect(closeTopSelect()).toBe(false)
    expect(close).not.toHaveBeenCalled()
  })

  it('falls back to the previous select once the top one unregisters', () => {
    const first = vi.fn()
    const second = vi.fn()
    register(first)
    const unregisterSecond = register(second)
    unregisterSecond()
    expect(closeTopSelect()).toBe(true)
    expect(first).toHaveBeenCalledOnce()
    expect(second).not.toHaveBeenCalled()
  })

  it('leaves the other selects registered when one in the middle unregisters', () => {
    const first = vi.fn()
    const second = vi.fn()
    const third = vi.fn()
    register(first)
    const unregisterSecond = register(second)
    register(third)
    unregisterSecond()
    closeTopSelect()
    expect(third).toHaveBeenCalledOnce()
    expect(second).not.toHaveBeenCalled()
    expect(first).not.toHaveBeenCalled()
  })

  it('ignores a second call to the same unregister function', () => {
    const first = vi.fn()
    const second = vi.fn()
    register(first)
    const unregisterSecond = register(second)
    unregisterSecond()
    unregisterSecond()
    expect(closeTopSelect()).toBe(true)
    expect(first).toHaveBeenCalledOnce()
  })
})
