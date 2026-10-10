// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'
import { ICON_COLORS, THEMES } from '@/lib/config'

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

describe('ColorSelector', () => {
  it('offers every supported icon color with its translated name', () => {
    render(<ColorSelector iconColor="lightPink" setIconColor={() => {}} t={t} />)
    expect(items().map((item) => item.dataset.value)).toEqual(ICON_COLORS)
    expect(items().map((item) => item.textContent)).toEqual(ICON_COLORS.map(colorLabel))
  })

  it('falls back to the color key when it has no translation', () => {
    const { colorLightPink: _omitted, ...withoutLightPink } = t
    render(<ColorSelector iconColor="lightPink" setIconColor={() => {}} t={withoutLightPink} />)
    expect(container.querySelector('li[data-value="lightPink"]').textContent).toBe('lightPink')
  })

  it('binds the select to the current icon color and its setter', () => {
    const setIconColor = vi.fn()
    render(<ColorSelector iconColor="darkGreen" setIconColor={setIconColor} t={t} />)
    expect(select.props.value).toBe('darkGreen')
    select.props.onValueChange('darkPink')
    expect(setIconColor).toHaveBeenCalledWith('darkPink')
  })

  it('hides the theme picker unless a theme and its setter are given', () => {
    render(<ColorSelector iconColor="lightPink" setIconColor={() => {}} t={t} />)
    expect(buttons()).toHaveLength(0)
    expect(container.textContent).not.toContain(t.appTheme)
  })

  it('hides the theme picker when only the theme is given', () => {
    render(<ColorSelector iconColor="lightPink" setIconColor={() => {}} theme="pink" t={t} />)
    expect(buttons()).toHaveLength(0)
  })

  it('shows the theme picker and selects the tapped theme', () => {
    const setTheme = vi.fn()
    render(
      <ColorSelector
        iconColor="lightPink"
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
