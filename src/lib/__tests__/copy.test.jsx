import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { COPY } from '@/lib/constants'
import { LANGUAGES } from '@/lib/config'
import { CopyProvider, useCopy } from '@/lib/copy'

function Probe({ report }) {
  report(useCopy())
  return null
}

const copyFor = (language) => {
  const report = vi.fn()
  renderToStaticMarkup(
    <CopyProvider language={language}>
      <Probe report={report} />
    </CopyProvider>
  )
  return report.mock.calls[0][0]
}

describe('CopyProvider / useCopy', () => {
  it.each(LANGUAGES)('provides the %s dictionary', (language) => {
    expect(copyFor(language)).toBe(COPY[language])
  })

  it.each([['fr'], [undefined], [null], ['']])(
    'falls back to English for an unsupported language (%o)',
    (language) => {
      expect(copyFor(language)).toBe(COPY.en)
    }
  )

  it('gives the English dictionary outside a provider', () => {
    const report = vi.fn()
    renderToStaticMarkup(<Probe report={report} />)
    expect(report).toHaveBeenCalledWith(COPY.en)
  })

  it('renders its children', () => {
    const html = renderToStaticMarkup(
      <CopyProvider language="es">
        <span>child</span>
      </CopyProvider>
    )
    expect(html).toBe('<span>child</span>')
  })
})
