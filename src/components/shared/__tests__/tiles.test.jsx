import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const palette = vi.hoisted(() => ({
  text: '#111111',
  textSoft: '#777777',
  cardBorder: '#aaaaaa',
  cardBg: '#eeeeee',
}))

vi.mock('@/lib/theme', () => ({ usePalette: () => palette }))

import StatTile from '@/components/shared/StatTile'
import TileCard from '@/components/shared/TileCard'

describe('TileCard', () => {
  it('renders its children', () => {
    const html = renderToStaticMarkup(
      <TileCard>
        <span>inside</span>
      </TileCard>
    )
    expect(html).toContain('<span>inside</span>')
  })

  it('uses the palette card colors by default', () => {
    const html = renderToStaticMarkup(<TileCard>x</TileCard>)
    expect(html).toContain(palette.cardBorder)
    expect(html).toContain(palette.cardBg)
  })

  it('drops the palette card colors when accented', () => {
    const html = renderToStaticMarkup(<TileCard accent>x</TileCard>)
    expect(html).not.toContain(palette.cardBorder)
    expect(html).not.toContain(palette.cardBg)
  })
})

describe('StatTile', () => {
  it('renders the label, value and helper', () => {
    const html = renderToStaticMarkup(<StatTile label="People" value={12} helper="tracked" />)
    expect(html).toContain('People')
    expect(html).toContain('>12<')
    expect(html).toContain('tracked')
  })

  it('omits the helper paragraph when there is no helper', () => {
    const withHelper = renderToStaticMarkup(<StatTile label="People" value={12} helper="tracked" />)
    const withoutHelper = renderToStaticMarkup(<StatTile label="People" value={12} />)
    expect(withHelper.match(/<p/g)).toHaveLength(3)
    expect(withoutHelper.match(/<p/g)).toHaveLength(2)
  })

  it('renders a zero value', () => {
    expect(renderToStaticMarkup(<StatTile label="People" value={0} />)).toContain('>0<')
  })

  it('colors the text from the palette unless accented', () => {
    const regular = renderToStaticMarkup(<StatTile label="People" value={12} />)
    const accent = renderToStaticMarkup(<StatTile label="People" value={12} accent />)
    expect(regular).toContain(`color:${palette.text}`)
    expect(accent).not.toContain(`color:${palette.text}`)
    expect(accent).toContain('color:#ffffff')
  })
})
