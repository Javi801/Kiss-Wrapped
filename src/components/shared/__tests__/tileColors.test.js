import { describe, it, expect } from 'vitest'
import { tileColors } from '@/components/shared/tileColors'

const palette = { text: '#111111', textSoft: '#777777' }

describe('tileColors', () => {
  it('takes the text colors from the palette for a regular tile', () => {
    expect(tileColors(false, palette)).toEqual({
      label: '#777777',
      value: '#111111',
      helper: '#777777',
    })
  })

  it('uses white tones, independent of the palette, for an accent tile', () => {
    const colors = tileColors(true, palette)
    expect(colors.value).toBe('#ffffff')
    expect(Object.values(colors)).not.toContain(palette.text)
    expect(Object.values(colors)).not.toContain(palette.textSoft)
    expect(tileColors(true, { text: 'red', textSoft: 'blue' })).toEqual(colors)
  })
})
