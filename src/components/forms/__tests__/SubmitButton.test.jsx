import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('@/lib/theme', () => ({
  usePalette: () => ({ accent: '#a00', accentSoft: '#f0f', textOnAccent: '#fff' }),
}))

import SubmitButton from '@/components/forms/SubmitButton'

describe('SubmitButton', () => {
  it('submits the form and renders its content', () => {
    const html = renderToStaticMarkup(
      <SubmitButton>
        <svg data-testid="icon" />
        Save
      </SubmitButton>
    )
    expect(html).toContain('type="submit"')
    expect(html).toContain('data-testid="icon"')
    expect(html).toContain('Save')
  })

  it('fills the button with the accent gradient and drops the border', () => {
    const html = renderToStaticMarkup(<SubmitButton>Save</SubmitButton>)
    expect(html).toContain('linear-gradient(90deg, #a00, #f0f)')
    expect(html).toContain('border:none')
    expect(html).toContain('color:#fff')
  })
})
