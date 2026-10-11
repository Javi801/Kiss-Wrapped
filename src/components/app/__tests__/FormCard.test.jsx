import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const palette = vi.hoisted(() => ({
  shadow: 'rgb(1, 1, 1)',
  cardBorder: 'rgb(2, 2, 2)',
  card: 'rgb(3, 3, 3)',
  cardSoft: 'rgb(4, 4, 4)',
}))

vi.mock('@/lib/theme', () => ({ usePalette: () => palette }))
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, style }) => (
    <section data-card="" className={className} style={style}>
      {children}
    </section>
  ),
  CardContent: ({ children, style }) => (
    <div data-card-content="" style={style}>
      {children}
    </div>
  ),
}))

import FormCard from '@/components/app/FormCard'

const render = (children) => renderToStaticMarkup(<FormCard>{children}</FormCard>)

describe('FormCard', () => {
  it('shows its children inside the content of a card', () => {
    const html = render(<form id="person" />)
    expect(html).toMatch(/^<section data-card=""[^>]*><div data-card-content=""[^>]*><form/)
    expect(html.match(/<form id="person">/g)).toHaveLength(1)
  })

  it('renders an empty card without children', () => {
    expect(render()).toMatch(/<div data-card-content=""[^>]*><\/div><\/section>$/)
  })

  it('takes its colors from the palette', () => {
    const html = render(null)
    expect(html).toContain(`0 4px 24px ${palette.shadow}`)
    expect(html).toContain(`0 0 0 1px ${palette.cardBorder}`)
    expect(html).toContain(`linear-gradient(160deg, ${palette.card} 0%, ${palette.cardSoft} 100%)`)
  })
})
