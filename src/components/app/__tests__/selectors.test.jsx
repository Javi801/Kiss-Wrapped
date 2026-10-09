// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'
import { ICON_COLORS, LANGUAGES, THEMES } from '@/lib/config'

const select = vi.hoisted(() => ({ props: null }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/ui/select', async () => {
  const { createElement } = await import('react')
  return {
    Select: (props) => {
      select.props = props
      return createElement('div', null, props.children)
    },
    SelectTrigger: () => null,
    SelectValue: () => null,
    SelectContent: ({ children }) => createElement('ul', null, children),
    SelectItem: ({ value, children }) => createElement('li', { 'data-value': value }, children),
  }
})

import ColorSelector from '@/components/app/ColorSelector'
import LanguageSelector from '@/components/app/LanguageSelector'
import ThemeSelector from '@/components/app/ThemeSelector'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en
const themeLabel = (key) => t[`theme${key.charAt(0).toUpperCase() + key.slice(1)}`]
const colorLabel = (key) => t[`color${key.charAt(0).toUpperCase() + key.slice(1)}`]

let container
let root

function render(element) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(element)
  })
}

const buttons = () => [...container.querySelectorAll('button')]
const items = () => [...container.querySelectorAll('li')]
const click = (node) =>
  act(() => {
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

beforeEach(() => {
  select.props = null
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('ThemeSelector', () => {
  it('offers every supported theme with its translated name', () => {
    render(<ThemeSelector theme="pink" setTheme={() => {}} t={t} />)
    expect(buttons().map((button) => button.textContent)).toEqual(THEMES.map(themeLabel))
    expect(THEMES.map(themeLabel).every(Boolean)).toBe(true)
  })

  it.each(THEMES)('selects the %s theme when its button is tapped', (theme) => {
    const setTheme = vi.fn()
    render(<ThemeSelector theme="pink" setTheme={setTheme} t={t} />)
    click(buttons().find((button) => button.textContent === themeLabel(theme)))
    expect(setTheme).toHaveBeenCalledOnce()
    expect(setTheme).toHaveBeenCalledWith(theme)
  })

  it('emphasizes only the active theme', () => {
    render(<ThemeSelector theme="green" setTheme={() => {}} t={t} />)
    const bold = [...container.querySelectorAll('span')]
      .filter((span) => span.style.fontWeight === '700')
      .map((span) => span.textContent)
    expect(bold).toEqual([themeLabel('green')])
  })
})

describe('ColorSelector', () => {
  it('offers every supported icon color with its translated name', () => {
    render(<ColorSelector iconColor="yellow" setIconColor={() => {}} t={t} />)
    expect(items().map((item) => item.dataset.value)).toEqual(ICON_COLORS)
    expect(items().map((item) => item.textContent)).toEqual(ICON_COLORS.map(colorLabel))
  })

  it('falls back to the color key when it has no translation', () => {
    const { colorYellow: _omitted, ...withoutYellow } = t
    render(<ColorSelector iconColor="yellow" setIconColor={() => {}} t={withoutYellow} />)
    expect(container.querySelector('li[data-value="yellow"]').textContent).toBe('yellow')
  })

  it('binds the select to the current icon color and its setter', () => {
    const setIconColor = vi.fn()
    render(<ColorSelector iconColor="blue" setIconColor={setIconColor} t={t} />)
    expect(select.props.value).toBe('blue')
    select.props.onValueChange('pink')
    expect(setIconColor).toHaveBeenCalledWith('pink')
  })

  it('hides the theme picker unless a theme and its setter are given', () => {
    render(<ColorSelector iconColor="yellow" setIconColor={() => {}} t={t} />)
    expect(buttons()).toHaveLength(0)
    expect(container.textContent).not.toContain(t.appTheme)
  })

  it('hides the theme picker when only the theme is given', () => {
    render(<ColorSelector iconColor="yellow" setIconColor={() => {}} theme="pink" t={t} />)
    expect(buttons()).toHaveLength(0)
  })

  it('shows the theme picker and selects the tapped theme', () => {
    const setTheme = vi.fn()
    render(
      <ColorSelector
        iconColor="yellow"
        setIconColor={() => {}}
        theme="pink"
        setTheme={setTheme}
        t={t}
      />
    )
    expect(buttons().map((button) => button.textContent)).toEqual(THEMES.map(themeLabel))
    click(buttons().find((button) => button.textContent === themeLabel('dark')))
    expect(setTheme).toHaveBeenCalledWith('dark')
  })
})

describe('LanguageSelector', () => {
  it('offers every supported language', () => {
    render(<LanguageSelector language="en" setLanguage={() => {}} t={t} />)
    expect(items().map((item) => item.dataset.value)).toEqual(LANGUAGES)
    expect(container.querySelector('li[data-value="en"]').textContent).toBe(t.english)
    expect(container.querySelector('li[data-value="es"]').textContent).toBe(t.spanish)
  })

  it('binds the select to the current language and its setter', () => {
    const setLanguage = vi.fn()
    render(<LanguageSelector language="es" setLanguage={setLanguage} t={t} />)
    expect(select.props.value).toBe('es')
    select.props.onValueChange('en')
    expect(setLanguage).toHaveBeenCalledWith('en')
  })
})
