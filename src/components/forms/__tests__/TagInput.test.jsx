// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))

import TagInput from '@/components/forms/TagInput'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const TAGS = ['Park', 'Party', 'Home']

let container
let root

// Keeps the input controlled, like the forms that use it.
function Harness({ initial = '', onChange, ...props }) {
  const [value, setValue] = useState(initial)
  return (
    <TagInput
      value={value}
      onChange={(next) => {
        onChange?.(next)
        setValue(next)
      }}
      tags={TAGS}
      addTagLabel="Add"
      {...props}
    />
  )
}

function render(props) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<Harness {...props} />)
  })
}

const input = () => container.querySelector('input')
const options = () => [...document.body.querySelectorAll('button')]
const labels = () => options().map((option) => option.textContent)
const focus = () => act(() => input().focus())
const pointerDown = (target) =>
  act(() => {
    target.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  })
const nextFrame = () => act(() => vi.advanceTimersToNextFrame())
const useFakeFrames = () =>
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })

function type(text) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  act(() => {
    setValue.call(input(), text)
    input().dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function pick(label) {
  const option = options().find((item) => item.textContent === label)
  act(() => option.click())
}

// Places the input at the given vertical position of a 768px-high viewport.
function placeInputAt(top, bottom) {
  vi.spyOn(input().parentElement, 'getBoundingClientRect').mockReturnValue({
    top,
    bottom,
    left: 10,
    width: 200,
  })
}

// jsdom has no layout: lays the fixed dropdown out where its style puts it,
// shifted by `offset` like a transformed dialog would.
function layoutDropdown({ offset = 0, height = 100 } = {}) {
  const native = Element.prototype.getBoundingClientRect
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.style?.position !== 'fixed') return native.call(this)
    const top = parseFloat(this.style.top) + offset
    const left = parseFloat(this.style.left) + offset
    return { top, left, height, bottom: top + height, width: parseFloat(this.style.width) }
  })
}

// jsdom has no visualViewport, which the component listens to for scrolls.
function stubVisualViewport() {
  const viewport = Object.assign(new EventTarget(), { height: 768, offsetTop: 0 })
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport })
  return viewport
}

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.useRealTimers()
  delete window.visualViewport
})

describe('TagInput — suggestions', () => {
  it('shows no suggestions until the input is focused', () => {
    render()
    expect(options()).toHaveLength(0)
  })

  it('suggests every tag when focused while empty', () => {
    render()
    focus()
    expect(labels()).toEqual(TAGS)
  })

  it('filters the suggestions by the typed text, ignoring case', () => {
    render({ initial: 'PA' })
    focus()
    expect(labels()).toEqual(['Park', 'Party'])
  })

  it('reports the typed text and filters the suggestions with it', () => {
    const onChange = vi.fn()
    render({ onChange })
    focus()
    type('ho')
    expect(onChange).toHaveBeenCalledWith('ho')
    expect(labels()).toEqual(['Home'])
  })

  it('opens the suggestions again when typing after they were closed', () => {
    useFakeFrames()
    render()
    focus()
    act(() => {
      input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    type('ho')
    nextFrame()
    expect(labels()).toEqual(['Home'])
  })

  it('shows nothing when no tag matches and tags cannot be added', () => {
    render({ initial: 'zzz' })
    focus()
    expect(options()).toHaveLength(0)
  })

  it('highlights the tag that matches the current value', () => {
    render({ initial: 'home' })
    focus()
    expect(options()[0].style.fontWeight).toBe('600')
  })

  it('fills the input with the picked tag and closes', () => {
    const onChange = vi.fn()
    render({ onChange })
    focus()
    pick('Party')
    expect(onChange).toHaveBeenCalledWith('Party')
    expect(input().value).toBe('Party')
    expect(options()).toHaveLength(0)
  })
})

describe('TagInput — adding a tag', () => {
  it('offers to add text that is not a tag yet', () => {
    render({ initial: '  Beach ', onAddTag: () => {} })
    focus()
    expect(labels()).toEqual(['+ Add "Beach"'])
  })

  it('lists the add option after the matching tags', () => {
    render({ initial: 'Par', onAddTag: () => {} })
    focus()
    expect(labels()).toEqual(['Park', 'Party', '+ Add "Par"'])
  })

  it('does not offer to add an existing tag, whatever its case', () => {
    render({ initial: 'home', onAddTag: () => {} })
    focus()
    expect(labels()).toEqual(['Home'])
  })

  it('does not offer to add blank text', () => {
    render({ initial: '   ', onAddTag: () => {} })
    focus()
    expect(labels()).toEqual(TAGS)
  })

  it('saves the trimmed tag, fills the input with it and closes', () => {
    const onAddTag = vi.fn()
    const onChange = vi.fn()
    render({ initial: '  Beach ', onAddTag, onChange })
    focus()
    pick('+ Add "Beach"')
    expect(onAddTag).toHaveBeenCalledWith('Beach')
    expect(onChange).toHaveBeenCalledWith('Beach')
    expect(options()).toHaveLength(0)
  })
})

describe('TagInput — closing', () => {
  it('closes on Escape', () => {
    render()
    focus()
    act(() => {
      input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(options()).toHaveLength(0)
  })

  it('stays open on other keys', () => {
    render()
    focus()
    act(() => {
      input().dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    })
    expect(labels()).toEqual(TAGS)
  })

  it('closes when the input loses focus', () => {
    render()
    focus()
    act(() => input().blur())
    expect(options()).toHaveLength(0)
  })

  it('closes when pressing outside the input and the suggestions', () => {
    render()
    focus()
    pointerDown(document.body)
    expect(options()).toHaveLength(0)
  })

  it('stays open when pressing inside the suggestions', () => {
    render()
    focus()
    pointerDown(options()[0])
    expect(labels()).toEqual(TAGS)
  })

  it('stays hidden while the parent dialog is closed', () => {
    render({ isParentOpen: false })
    focus()
    expect(options()).toHaveLength(0)
  })

  it('closes when the input scrolls out of view', () => {
    render()
    focus()
    placeInputAt(-80, -40)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(options()).toHaveLength(0)
  })
})

describe('TagInput — placement', () => {
  const dropdown = () => options()[0].parentElement
  let viewport

  beforeEach(() => {
    useFakeFrames()
    viewport = stubVisualViewport()
  })

  // The input is spied first so its own mock doesn't fall through to the prototype's.
  function openAt(top, bottom, layout) {
    render()
    placeInputAt(top, bottom)
    layoutDropdown(layout)
    focus()
    nextFrame()
  }

  it('stays hidden until the dropdown has been measured', () => {
    render()
    placeInputAt(100, 140)
    layoutDropdown()
    focus()
    expect(dropdown().style.visibility).toBe('hidden')
    nextFrame()
    expect(dropdown().style.visibility).toBe('visible')
  })

  it('opens below the input when there is room', () => {
    openAt(100, 140)
    expect(dropdown().style.top).toBe('144px')
    expect(dropdown().style.left).toBe('10px')
    expect(dropdown().style.width).toBe('200px')
  })

  it('opens above the input when there is little room below', () => {
    openAt(700, 740)
    // 700 - 4px gap - 100px rendered height.
    expect(dropdown().style.top).toBe('596px')
  })

  it('never grows taller than 240px', () => {
    openAt(100, 140)
    expect(dropdown().style.maxHeight).toBe('240px')
  })

  it('shrinks to the space left below the input', () => {
    openAt(10, 564)
    // 768 - 564 - 4px gap - 8px margin.
    expect(dropdown().style.maxHeight).toBe('192px')
  })

  it('corrects for the dialog shifting the dropdown', () => {
    openAt(100, 140, { offset: 20 })
    expect(dropdown().style.top).toBe('124px')
    expect(dropdown().style.left).toBe('-10px')
    nextFrame()
    expect(dropdown().style.top).toBe('124px')
  })

  it('follows the input when the page scrolls', () => {
    openAt(100, 140)
    placeInputAt(60, 100)
    act(() => {
      viewport.dispatchEvent(new Event('scroll'))
    })
    expect(dropdown().style.top).toBe('104px')
  })

  it('follows the input when it moves without a scroll or resize event', () => {
    openAt(100, 140)
    placeInputAt(60, 100)
    nextFrame()
    expect(dropdown().style.top).toBe('104px')
  })

  it('closes when the input moves out of view without a scroll or resize event', () => {
    openAt(100, 140)
    placeInputAt(-80, -40)
    nextFrame()
    expect(options()).toHaveLength(0)
  })

  it('moves above the input once the room below runs out', () => {
    openAt(100, 140)
    placeInputAt(600, 640)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(dropdown().style.top).toBe('496px')
  })

  it('stays above the input while there is still room there', () => {
    openAt(700, 740)
    placeInputAt(400, 440)
    act(() => {
      viewport.dispatchEvent(new Event('scroll'))
    })
    expect(dropdown().style.top).toBe('296px')
  })
})
