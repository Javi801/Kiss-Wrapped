// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { useScrollFade } from '@/hooks/useScrollFade'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Layout of the scroll container; jsdom computes none of its own.
const layout = { scrollHeight: 0, clientHeight: 0, scrollTop: 0 }
// ResizeObserver instances created by the hook.
let resizeObservers
// jsdom drops the gradient the hook writes, so inline styles are plain objects here.
let styles

class FakeResizeObserver {
  constructor(callback) {
    this.callback = callback
    this.observed = []
    this.disconnected = false
    resizeObservers.push(this)
  }
  observe(node) {
    this.observed.push(node)
  }
  disconnect() {
    this.disconnected = true
  }
}

function Scroller({ children }) {
  const ref = useScrollFade()
  return (
    <div ref={ref} data-testid="scroller">
      {children}
    </div>
  )
}

let container
let root

function render(children) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<Scroller>{children}</Scroller>)
  })
  return container.querySelector('[data-testid="scroller"]')
}

function unmount() {
  act(() => root.unmount())
  root = null
}

const fade = (top, bottom) =>
  `linear-gradient(to bottom, transparent 0, #000 ${top}px, #000 calc(100% - ${bottom}px), transparent 100%)`
const scroll = (node) => act(() => node.dispatchEvent(new Event('scroll')))
// Lets the MutationObserver deliver its records.
const flushMutations = () => act(async () => {})

beforeEach(() => {
  Object.assign(layout, { scrollHeight: 0, clientHeight: 0, scrollTop: 0 })
  resizeObservers = []
  styles = new WeakMap()
  vi.spyOn(HTMLElement.prototype, 'style', 'get').mockImplementation(function () {
    if (!styles.has(this)) styles.set(this, { maskImage: '', webkitMaskImage: '' })
    return styles.get(this)
  })
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  for (const key of Object.keys(layout)) {
    vi.spyOn(HTMLElement.prototype, key, 'get').mockImplementation(() => layout[key])
  }
})

afterEach(() => {
  if (root) unmount()
  container?.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useScrollFade', () => {
  it('applies no fade when everything fits', () => {
    Object.assign(layout, { scrollHeight: 300, clientHeight: 300 })
    const node = render()
    expect(node.style.maskImage).toBe('')
    expect(node.style.webkitMaskImage).toBe('')
  })

  it('fades only the bottom edge while content is hidden below', () => {
    Object.assign(layout, { scrollHeight: 500, clientHeight: 300 })
    const node = render()
    expect(node.style.maskImage).toBe(fade(0, 40))
    expect(node.style.webkitMaskImage).toBe(fade(0, 40))
  })

  it('fades both edges once the content is scrolled', () => {
    Object.assign(layout, { scrollHeight: 500, clientHeight: 300 })
    const node = render()
    layout.scrollTop = 100
    scroll(node)
    expect(node.style.maskImage).toBe(fade(40, 40))
  })

  it('fades only the top edge at the end of the content', () => {
    Object.assign(layout, { scrollHeight: 500, clientHeight: 300 })
    const node = render()
    layout.scrollTop = 200
    scroll(node)
    expect(node.style.maskImage).toBe(fade(40, 0))
  })

  it('grows each fade with the hidden distance up to its maximum', () => {
    Object.assign(layout, { scrollHeight: 325, clientHeight: 300 })
    const node = render()
    layout.scrollTop = 10
    scroll(node)
    expect(node.style.maskImage).toBe(fade(10, 15))
  })

  it('ignores a hidden distance below one pixel', () => {
    Object.assign(layout, { scrollHeight: 300.5, clientHeight: 300 })
    const node = render()
    expect(node.style.maskImage).toBe('')
  })

  it('never uses a negative fade when the browser overscrolls past an edge', () => {
    Object.assign(layout, { scrollHeight: 300, clientHeight: 300, scrollTop: -20 })
    const node = render()
    expect(node.style.maskImage).toBe(fade(0, 20))
    layout.scrollTop = 20
    scroll(node)
    expect(node.style.maskImage).toBe(fade(20, 0))
  })

  it('removes the fade when the content fits again', () => {
    Object.assign(layout, { scrollHeight: 500, clientHeight: 300 })
    const node = render()
    layout.scrollHeight = 300
    scroll(node)
    expect(node.style.maskImage).toBe('')
  })

  it('updates when the container is resized', () => {
    Object.assign(layout, { scrollHeight: 300, clientHeight: 300 })
    const node = render()
    expect(resizeObservers).toHaveLength(1)
    expect(resizeObservers[0].observed).toEqual([node])

    layout.clientHeight = 200
    act(() => resizeObservers[0].callback())
    expect(node.style.maskImage).toBe(fade(0, 40))
  })

  it('updates when the content changes without a scroll', async () => {
    Object.assign(layout, { scrollHeight: 300, clientHeight: 300 })
    const node = render()
    layout.scrollHeight = 500
    node.appendChild(document.createElement('p'))
    await flushMutations()
    expect(node.style.maskImage).toBe(fade(0, 40))
  })

  it('works without ResizeObserver support', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    Object.assign(layout, { scrollHeight: 500, clientHeight: 300 })
    const node = render()
    expect(node.style.maskImage).toBe(fade(0, 40))
    layout.scrollTop = 200
    scroll(node)
    expect(node.style.maskImage).toBe(fade(40, 0))
  })

  it('stops following the container once it unmounts', async () => {
    Object.assign(layout, { scrollHeight: 500, clientHeight: 300 })
    const node = render()
    unmount()
    expect(resizeObservers[0].disconnected).toBe(true)

    layout.scrollTop = 200
    node.dispatchEvent(new Event('scroll'))
    node.appendChild(document.createElement('p'))
    await flushMutations()
    expect(node.style.maskImage).toBe(fade(0, 40))
  })
})
