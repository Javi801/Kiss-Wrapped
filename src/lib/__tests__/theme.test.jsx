import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PALETTES } from '@/lib/constants'
import { THEMES } from '@/lib/config'
import { ThemeProvider, usePalette } from '@/lib/theme'

function Probe({ report }) {
  report(usePalette())
  return null
}

const paletteFor = (theme) => {
  const report = vi.fn()
  renderToStaticMarkup(
    <ThemeProvider theme={theme}>
      <Probe report={report} />
    </ThemeProvider>
  )
  return report.mock.calls[0][0]
}

describe('ThemeProvider / usePalette', () => {
  it.each(THEMES)('provides the %s palette', (theme) => {
    expect(paletteFor(theme)).toBe(PALETTES[theme])
  })

  it.each([['unknown'], [undefined], [null], ['']])(
    'falls back to the pink palette for an unsupported theme (%o)',
    (theme) => {
      expect(paletteFor(theme)).toBe(PALETTES.pink)
    }
  )

  it('gives the pink palette outside a provider', () => {
    const report = vi.fn()
    renderToStaticMarkup(<Probe report={report} />)
    expect(report).toHaveBeenCalledWith(PALETTES.pink)
  })

  it('renders its children', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider theme="dark">
        <span>child</span>
      </ThemeProvider>
    )
    expect(html).toBe('<span>child</span>')
  })
})
