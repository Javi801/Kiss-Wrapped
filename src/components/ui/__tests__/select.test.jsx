// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { closeTopSelect } from '@/lib/open-selects'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container
let root

// Only the trigger is rendered: the popup needs layout that jsdom does not provide.
function render(selectProps = {}, triggerProps = {}) {
  if (!root) {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  }
  act(() => {
    root.render(
      <Select {...selectProps}>
        <SelectTrigger {...triggerProps}>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
      </Select>
    )
  })
}

const trigger = () => container.querySelector('[data-slot="select-trigger"]')
const isOpen = () => trigger().getAttribute('aria-expanded') === 'true'

function pointerDown(pointerType) {
  const event = new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  act(() => {
    trigger().dispatchEvent(event)
  })
}

// A tap or click as the browser reports it: pointerdown first, then click.
function press(pointerType) {
  pointerDown(pointerType)
  const click = new MouseEvent('click', { bubbles: true, cancelable: true })
  act(() => {
    trigger().dispatchEvent(click)
  })
  return click
}

const closeFromBackButton = () => {
  let closed
  act(() => {
    closed = closeTopSelect()
  })
  return closed
}

beforeEach(() => {
  // Pointer capture is not implemented by jsdom.
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.releasePointerCapture ??= () => {}
})

afterEach(() => {
  if (root) act(() => root.unmount())
  container?.remove()
  root = null
})

describe('Select — opening from the trigger', () => {
  it('starts closed', () => {
    render()
    expect(isOpen()).toBe(false)
  })

  it('opens on a touch tap and takes the click away from Radix', () => {
    const onOpenChange = vi.fn()
    render({ onOpenChange })
    const click = press('touch')
    expect(isOpen()).toBe(true)
    expect(click.defaultPrevented).toBe(true)
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('focuses the trigger when it opens on a touch tap', () => {
    render()
    press('touch')
    expect(document.activeElement).toBe(trigger())
  })

  it('opens on a pen tap like on touch', () => {
    render()
    const click = press('pen')
    expect(isOpen()).toBe(true)
    expect(click.defaultPrevented).toBe(true)
  })

  it('opens on a click that follows no pointer event', () => {
    render()
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    act(() => {
      trigger().dispatchEvent(click)
    })
    expect(isOpen()).toBe(true)
    expect(click.defaultPrevented).toBe(true)
  })

  it('leaves a mouse click to Radix, which opens once on pointer down', () => {
    const onOpenChange = vi.fn()
    render({ onOpenChange })
    const click = press('mouse')
    expect(isOpen()).toBe(true)
    expect(click.defaultPrevented).toBe(false)
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('still calls the pointer and click handlers given to the trigger', () => {
    const onClick = vi.fn()
    const onPointerDown = vi.fn()
    render({}, { onClick, onPointerDown })
    press('touch')
    expect(onPointerDown).toHaveBeenCalledOnce()
    expect(onClick).toHaveBeenCalledOnce()
    expect(isOpen()).toBe(true)
  })

  it('does not open a disabled select', () => {
    const onOpenChange = vi.fn()
    render({ onOpenChange, disabled: true })
    press('touch')
    expect(isOpen()).toBe(false)
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})

describe('Select — open state', () => {
  it('starts open with defaultOpen', () => {
    render({ defaultOpen: true })
    expect(isOpen()).toBe(true)
  })

  it('follows the open prop when it is controlled', () => {
    const onOpenChange = vi.fn()
    render({ open: false, onOpenChange })
    press('touch')
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(isOpen()).toBe(false)

    render({ open: true, onOpenChange })
    expect(isOpen()).toBe(true)
  })
})

describe('Select — hardware back button', () => {
  it('is not registered while closed', () => {
    render()
    expect(closeFromBackButton()).toBe(false)
  })

  it('closes when the back button asks for the top select', () => {
    const onOpenChange = vi.fn()
    render({ onOpenChange })
    press('touch')

    expect(closeFromBackButton()).toBe(true)
    expect(isOpen()).toBe(false)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('is no longer registered once it has closed', () => {
    render()
    press('touch')
    closeFromBackButton()
    expect(closeFromBackButton()).toBe(false)
  })

  it('asks a controlled select to close without closing it itself', () => {
    const onOpenChange = vi.fn()
    render({ open: true, onOpenChange })
    expect(closeFromBackButton()).toBe(true)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(isOpen()).toBe(true)
  })

  it('is no longer registered once it unmounts while open', () => {
    render({ defaultOpen: true })
    act(() => root.unmount())
    root = null
    expect(closeFromBackButton()).toBe(false)
  })
})
