// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'
import { THEMES } from '@/lib/config'
import { ICON_SHAPES, ICON_TONES } from '@/components/shared/SparkleIcon.constants'

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
const shapeLabel = (key) => t[`icon${key.charAt(0).toUpperCase() + key.slice(1)}`]

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
  const iconButtons = () => buttons().filter((button) => button.hasAttribute('aria-pressed'))
  const themeButtons = () => buttons().filter((button) => !button.hasAttribute('aria-pressed'))

  it('offers every icon color with its translated name', () => {
    render(<ColorSelector iconColor="notebookPink" setIconColor={() => {}} t={t} />)
    const colors = Object.keys(ICON_TONES)
    expect(items().map((item) => item.dataset.value)).toEqual(colors)
    expect(items().map((item) => item.textContent)).toEqual(colors.map(colorLabel))
  })

  it('falls back to the color key when it has no translation', () => {
    const { colorPink: _omitted, ...withoutPink } = t
    render(<ColorSelector iconColor="notebookPink" setIconColor={() => {}} t={withoutPink} />)
    expect(container.querySelector('li[data-value="pink"]').textContent).toBe('pink')
  })

  it('binds the select to the current icon color and keeps the design on change', () => {
    const setIconColor = vi.fn()
    render(<ColorSelector iconColor="chartGreen" setIconColor={setIconColor} t={t} />)
    expect(select.props.value).toBe('green')
    select.props.onValueChange('lavender')
    expect(setIconColor).toHaveBeenCalledWith('chartLavender')
  })

  it('previews every design in the selected color and marks the current one', () => {
    render(<ColorSelector iconColor="orbitLavender" setIconColor={() => {}} t={t} />)
    expect(iconButtons().map((button) => button.getAttribute('aria-label'))).toEqual(
      ICON_SHAPES.map(shapeLabel)
    )
    expect(iconButtons().map((button) => button.querySelector('img').getAttribute('src'))).toEqual(
      ICON_SHAPES.map((shape) => expect.stringContaining(`${shape}_lavender`))
    )
    expect(iconButtons().map((button) => button.getAttribute('aria-pressed'))).toEqual(
      ICON_SHAPES.map((shape) => String(shape === 'orbit'))
    )
  })

  it('selects the tapped design and keeps the color', () => {
    const setIconColor = vi.fn()
    render(<ColorSelector iconColor="notebookGreen" setIconColor={setIconColor} t={t} />)
    click(iconButtons().find((button) => button.getAttribute('aria-label') === shapeLabel('chart')))
    expect(setIconColor).toHaveBeenCalledWith('chartGreen')
  })

  it('ignores a tap on the current design', () => {
    const setIconColor = vi.fn()
    render(<ColorSelector iconColor="notebookGreen" setIconColor={setIconColor} t={t} />)
    click(
      iconButtons().find((button) => button.getAttribute('aria-label') === shapeLabel('notebook'))
    )
    expect(setIconColor).not.toHaveBeenCalled()
  })

  it('shows the default icon for an unknown icon value', () => {
    render(<ColorSelector iconColor="lightPink" setIconColor={() => {}} t={t} />)
    expect(select.props.value).toBe('pink')
    expect(iconButtons().map((button) => button.getAttribute('aria-pressed'))).toEqual(
      ICON_SHAPES.map((shape) => String(shape === 'notebook'))
    )
  })

  it('hides the theme picker unless a theme and its setter are given', () => {
    render(<ColorSelector iconColor="notebookPink" setIconColor={() => {}} t={t} />)
    expect(themeButtons()).toHaveLength(0)
    expect(container.textContent).not.toContain(t.appTheme)
  })

  it('hides the theme picker when only the theme is given', () => {
    render(<ColorSelector iconColor="notebookPink" setIconColor={() => {}} theme="pink" t={t} />)
    expect(themeButtons()).toHaveLength(0)
  })

  it('shows the theme picker and selects the tapped theme', () => {
    const setTheme = vi.fn()
    render(
      <ColorSelector
        iconColor="notebookPink"
        setIconColor={() => {}}
        theme="pink"
        setTheme={setTheme}
        t={t}
      />
    )
    expect(themeButtons().map((button) => button.textContent)).toEqual(THEMES.map(themeLabel))
    click(themeButtons().find((button) => button.textContent === themeLabel('dark')))
    expect(setTheme).toHaveBeenCalledWith('dark')
  })
})
