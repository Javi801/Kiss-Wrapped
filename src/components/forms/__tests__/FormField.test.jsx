import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/ui/label', async () => {
  const { createElement } = await import('react')
  return { Label: ({ children }) => createElement('label', null, children) }
})

import FormField, { FieldError } from '@/components/forms/FormField'

// Markup without the separators React may insert between adjacent texts.
const render = (element) => renderToStaticMarkup(element).replaceAll('<!-- -->', '')

describe('FormField', () => {
  it('renders the label and the control', () => {
    const html = renderToStaticMarkup(
      <FormField label="Name">
        <input data-testid="control" />
      </FormField>
    )
    expect(html).toContain('<label>Name</label>')
    expect(html).toContain('data-testid="control"')
  })

  it('marks a required field', () => {
    const html = renderToStaticMarkup(
      <FormField label="Name" required>
        <input />
      </FormField>
    )
    expect(html).toContain('<label>Name *</label>')
  })

  it('shows the character counter only with a maximum length', () => {
    const withCounter = render(
      <FormField label="Name" length={3} maxLength={40}>
        <input />
      </FormField>
    )
    expect(withCounter).toContain('>3/40</p>')

    const withoutCounter = renderToStaticMarkup(
      <FormField label="Name" length={3}>
        <input />
      </FormField>
    )
    expect(withoutCounter).not.toContain('<p')
  })

  it('shows the counter at zero for an empty value', () => {
    const html = render(
      <FormField label="Name" length={0} maxLength={40}>
        <input />
      </FormField>
    )
    expect(html).toContain('>0/40</p>')
  })

  it('shows the error only when there is one', () => {
    const withError = renderToStaticMarkup(
      <FormField label="Name" error="Name is required">
        <input />
      </FormField>
    )
    expect(withError).toContain('Name is required')

    const withoutError = renderToStaticMarkup(
      <FormField label="Name">
        <input />
      </FormField>
    )
    expect(withoutError).not.toContain('<p')
  })

  it('places the counter between the control and the error', () => {
    const html = render(
      <FormField label="Name" length={3} maxLength={40} error="Too short">
        <input data-testid="control" />
      </FormField>
    )
    const control = html.indexOf('data-testid="control"')
    const counter = html.indexOf('>3/40<')
    const error = html.indexOf('Too short')
    expect(control).toBeLessThan(counter)
    expect(counter).toBeLessThan(error)
  })
})

describe('FieldError', () => {
  it('renders the message', () => {
    expect(renderToStaticMarkup(<FieldError>Invalid date</FieldError>)).toContain(
      '>Invalid date</p>'
    )
  })
})
