import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ICON_COLORS } from '@/lib/config'
import { SparkleIcon } from '@/components/shared/SparkleIcon'
import { ICON_VARIANTS, DEFAULT_ICON_VARIANT } from '@/components/shared/SparkleIcon.constants'

const src = (html) => html.match(/src="([^"]+)"/)?.[1]

describe('SparkleIcon', () => {
  it.each(ICON_COLORS)('shows the image of the %s icon', (color) => {
    const html = renderToStaticMarkup(<SparkleIcon palette={color} />)
    expect(src(html).endsWith(`/${ICON_VARIANTS[color].image}`)).toBe(true)
  })

  it('shows a different image for every color', () => {
    const sources = ICON_COLORS.map((color) =>
      src(renderToStaticMarkup(<SparkleIcon palette={color} />))
    )
    expect(new Set(sources).size).toBe(ICON_COLORS.length)
  })

  it('defaults to the default icon color', () => {
    expect(renderToStaticMarkup(<SparkleIcon />)).toBe(
      renderToStaticMarkup(<SparkleIcon palette={DEFAULT_ICON_VARIANT} />)
    )
  })

  it('falls back to the default icon color for an unknown palette', () => {
    expect(renderToStaticMarkup(<SparkleIcon palette="teal" />)).toBe(
      renderToStaticMarkup(<SparkleIcon palette={DEFAULT_ICON_VARIANT} />)
    )
  })

  it('renders a square image of the requested size', () => {
    const html = renderToStaticMarkup(<SparkleIcon size={48} />)
    expect(html).toContain('width="48"')
    expect(html).toContain('height="48"')
  })
})
