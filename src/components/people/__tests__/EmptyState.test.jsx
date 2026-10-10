import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))

import EmptyState from '@/components/people/EmptyState'

const Icon = () => <svg data-testid="empty-icon" />

describe('EmptyState', () => {
  it('renders the icon, title and description', () => {
    const html = renderToStaticMarkup(
      <EmptyState icon={Icon} title="No people yet" description="Add someone to start" />
    )
    expect(html).toContain('data-testid="empty-icon"')
    expect(html).toContain('<h3')
    expect(html).toContain('No people yet')
    expect(html).toContain('Add someone to start')
  })

  it('renders the optional action', () => {
    const html = renderToStaticMarkup(
      <EmptyState icon={Icon} title="t" description="d" action={<button>Add person</button>} />
    )
    expect(html).toContain('<button>Add person</button>')
  })

  it('renders no button when there is no action', () => {
    const html = renderToStaticMarkup(<EmptyState icon={Icon} title="t" description="d" />)
    expect(html).not.toContain('<button')
  })
})
