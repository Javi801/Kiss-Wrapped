import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('framer-motion', async () => {
  const { createElement } = await import('react')
  return {
    motion: {
      // Marks each floating item and drops the animation props.
      div: ({ children, style }) => createElement('div', { style, 'data-item': true }, children),
    },
  }
})

import BubbleStarsBackground from '@/components/visuals/BubbleStarsBackground'

const render = () => renderToStaticMarkup(<BubbleStarsBackground />)
const positions = (html) =>
  [...html.matchAll(/style="[^"]*left:([\d.]+)%;top:([\d.]+)%"[^>]*data-item/g)].map((match) => [
    Number(match[1]),
    Number(match[2]),
  ])

describe('BubbleStarsBackground', () => {
  it('scatters sixteen floating shapes', () => {
    expect(positions(render())).toHaveLength(16)
  })

  it('keeps every shape inside the background', () => {
    expect(positions(render())).not.toHaveLength(0)
    for (const [left, top] of positions(render())) {
      expect(left).toBeGreaterThanOrEqual(0)
      expect(left).toBeLessThanOrEqual(100)
      expect(top).toBeGreaterThanOrEqual(0)
      expect(top).toBeLessThanOrEqual(100)
    }
  })

  it('does not stack shapes on the same spot', () => {
    const spots = positions(render()).map(([left, top]) => `${left},${top}`)
    expect(new Set(spots).size).toBe(16)
  })

  it('mixes stars and bubbles', () => {
    const html = render()
    const stars = html.match(/clip-path:polygon/g) ?? []
    const bubbles = html.match(/class="rounded-full"/g) ?? []
    expect(stars).toHaveLength(6)
    expect(bubbles).toHaveLength(10)
  })

  it('draws the same layout every time', () => {
    expect(render()).toBe(render())
  })

  it('never intercepts taps', () => {
    expect(render()).toMatch(/^<div style="pointer-events:none/)
  })
})
