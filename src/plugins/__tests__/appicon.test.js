import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPlugin = vi.hoisted(() => ({ setColor: vi.fn() }))
const mockRegisterPlugin = vi.hoisted(() => vi.fn(() => mockPlugin))

vi.mock('@capacitor/core', () => ({ registerPlugin: mockRegisterPlugin }))

import { setAppIconColor } from '@/plugins/appicon'

describe('setAppIconColor', () => {
  beforeEach(() => {
    mockPlugin.setColor.mockReset()
    mockPlugin.setColor.mockResolvedValue(undefined)
  })

  it('registers the native plugin under the AppIcon name', () => {
    expect(mockRegisterPlugin).toHaveBeenCalledWith('AppIcon')
  })

  it('asks the plugin to switch to the given color', async () => {
    await setAppIconColor('pink')
    expect(mockPlugin.setColor).toHaveBeenCalledOnce()
    expect(mockPlugin.setColor).toHaveBeenCalledWith({ color: 'pink' })
  })

  it('resolves when the plugin is unavailable', async () => {
    mockPlugin.setColor.mockRejectedValue(new Error('AppIcon plugin is not implemented on web'))
    await expect(setAppIconColor('blue')).resolves.toBeUndefined()
  })

  it('resolves when the plugin throws synchronously', async () => {
    mockPlugin.setColor.mockImplementation(() => {
      throw new Error('not implemented')
    })
    await expect(setAppIconColor('blue')).resolves.toBeUndefined()
  })
})
