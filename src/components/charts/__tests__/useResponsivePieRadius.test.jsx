// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { useResponsivePieRadius } from '@/components/charts/useResponsivePieRadius'
import { FullscreenContext, useFullscreen } from '@/components/charts/FullscreenContext'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const ORIGINAL_WIDTH = window.innerWidth

let container
let root
let result

const report = (value) => {
  result = value
}

function Probe({ isFullscreen, onResult }) {
  onResult(useResponsivePieRadius(isFullscreen))
  return null
}

function renderHook(isFullscreen) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<Probe isFullscreen={isFullscreen} onResult={report} />)
  })
}

function setViewportWidth(width) {
  window.innerWidth = width
}

afterEach(() => {
  if (root) act(() => root.unmount())
  container?.remove()
  root = null
  container = null
  result = null
  window.innerWidth = ORIGINAL_WIDTH
  vi.restoreAllMocks()
})

describe('useResponsivePieRadius', () => {
  it('returns the fixed card size outside fullscreen, whatever the viewport', () => {
    setViewportWidth(1200)
    renderHook(false)
    expect(result).toEqual({ chartHeight: '14rem', innerRadius: 50, outerRadius: 80 })
  })

  it.each([
    [280, 96],
    [360, 96],
    [400, 109],
    [500, 145],
    [600, 160],
    [1200, 160],
  ])('sizes the fullscreen pie from a %ipx viewport to a %ipx radius', (width, outerRadius) => {
    setViewportWidth(width)
    renderHook(true)
    expect(result.outerRadius).toBe(outerRadius)
  })

  it('keeps the fullscreen radius between 96 and 160', () => {
    for (const width of [1, 200, 360, 480, 800, 4000]) {
      setViewportWidth(width)
      renderHook(true)
      expect(result.outerRadius).toBeGreaterThanOrEqual(96)
      expect(result.outerRadius).toBeLessThanOrEqual(160)
      act(() => root.unmount())
      root = null
    }
  })

  it('keeps the donut hole at 60% of the outer radius in fullscreen', () => {
    setViewportWidth(1200)
    renderHook(true)
    expect(result.innerRadius).toBe(96)
    expect(result.chartHeight).not.toBe('14rem')
  })

  it('falls back to a 360px viewport when the width is unknown', () => {
    setViewportWidth(0)
    renderHook(true)
    const fallback = result
    act(() => root.unmount())
    setViewportWidth(360)
    renderHook(true)
    expect(fallback).toEqual(result)
  })

  it.each(['resize', 'orientationchange'])('recomputes the radius on %s', (eventName) => {
    setViewportWidth(360)
    renderHook(true)
    expect(result.outerRadius).toBe(96)

    setViewportWidth(1200)
    act(() => {
      window.dispatchEvent(new Event(eventName))
    })
    expect(result.outerRadius).toBe(160)
  })

  it('ignores viewport changes outside fullscreen', () => {
    setViewportWidth(360)
    renderHook(false)
    setViewportWidth(1200)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.outerRadius).toBe(80)
  })

  it('stops listening once unmounted', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    renderHook(true)
    act(() => root.unmount())
    root = null
    const removed = remove.mock.calls.map(([name]) => name)
    expect(removed).toContain('resize')
    expect(removed).toContain('orientationchange')
  })

  it('renders on the server with the default viewport', () => {
    expect(() => renderToStaticMarkup(<Probe isFullscreen onResult={report} />)).not.toThrow()
    expect(result.outerRadius).toBeGreaterThanOrEqual(96)
  })
})

describe('useFullscreen', () => {
  function Reader() {
    return <span>{String(useFullscreen())}</span>
  }

  it('is false outside a fullscreen wrapper', () => {
    expect(renderToStaticMarkup(<Reader />)).toBe('<span>false</span>')
  })

  it('reads the value provided by the wrapper', () => {
    const html = renderToStaticMarkup(
      <FullscreenContext.Provider value={true}>
        <Reader />
      </FullscreenContext.Provider>
    )
    expect(html).toBe('<span>true</span>')
  })
})
