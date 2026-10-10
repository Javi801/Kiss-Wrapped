import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ICON_COLORS } from '@/lib/config'
import { SparkleIcon, PALETTE_SWATCHES } from '@/components/shared/SparkleIcon'
import {
  PALETTE_SWATCHES as SOURCE_SWATCHES,
  SPARKLE_PALETTES,
  SPARKLE_VIEWBOX,
} from '@/components/shared/SparkleIcon.constants'

const fills = (html) => [...html.matchAll(/fill="([^"]+)"/g)].map((match) => match[1])

describe('SparkleIcon', () => {
  it.each(ICON_COLORS)('draws the %s icon only with that palette', (color) => {
    const used = new Set(fills(renderToStaticMarkup(<SparkleIcon palette={color} />)))
    const allowed = Object.values(SPARKLE_PALETTES[color])
    expect(used.size).toBeGreaterThan(0)
    expect([...used].every((fill) => allowed.includes(fill))).toBe(true)
  })

  it('draws the same pixels for every color', () => {
    const counts = ICON_COLORS.map(
      (color) => fills(renderToStaticMarkup(<SparkleIcon palette={color} />)).length
    )
    expect(new Set(counts).size).toBe(1)
  })

  it('defaults to the yellow palette', () => {
    expect(renderToStaticMarkup(<SparkleIcon />)).toBe(
      renderToStaticMarkup(<SparkleIcon palette="yellow" />)
    )
  })

  it('falls back to purple for an unknown palette', () => {
    expect(renderToStaticMarkup(<SparkleIcon palette="teal" />)).toBe(
      renderToStaticMarkup(<SparkleIcon palette="purple" />)
    )
  })

  it('renders a square svg of the requested size', () => {
    const html = renderToStaticMarkup(<SparkleIcon size={48} />)
    expect(html).toContain('width="48"')
    expect(html).toContain('height="48"')
    expect(html).toContain(`viewBox="0 0 ${SPARKLE_VIEWBOX} ${SPARKLE_VIEWBOX}"`)
  })

  it('re-exports the swatches used by the color selector', () => {
    expect(PALETTE_SWATCHES).toBe(SOURCE_SWATCHES)
  })
})
