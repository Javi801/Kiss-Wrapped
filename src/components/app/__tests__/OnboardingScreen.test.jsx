// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

// onDragEnd of the slide currently on screen.
const slide = vi.hoisted(() => ({ onDragEnd: null }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('framer-motion', async () => {
  const { createElement } = await import('react')
  // Renders a plain element, dropping the animation and gesture props.
  const plain =
    (tag) =>
    ({ children, style, onDragEnd, drag }) => {
      if (drag) slide.onDragEnd = onDragEnd
      return createElement(tag, { style }, children)
    }
  return {
    motion: { div: plain('div'), h1: plain('h1'), p: plain('p') },
    AnimatePresence: ({ children }) => children,
  }
})

import OnboardingScreen from '@/components/app/OnboardingScreen'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = {
  ...COPY.en,
  onboardingSlides: [
    { type: 'mockup', title: 'Hidden entry', description: 'Tap the heart' },
    { emoji: '📝', title: 'Add people', description: 'Save who you met' },
    { emoji: '📊', title: 'See stats', description: 'Charts and totals' },
  ],
}

let container
let root
let onComplete

function render(dictionary = t) {
  onComplete = vi.fn()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<OnboardingScreen t={dictionary} onComplete={onComplete} />)
  })
}

const title = () => container.querySelector('h1').textContent
const button = (label) =>
  [...container.querySelectorAll('button')].find(
    (item) => item.textContent === label || item.getAttribute('aria-label') === label
  )
const press = (label) => act(() => button(label).click())
const swipe = (offsetX, velocityX) =>
  act(() => slide.onDragEnd(null, { offset: { x: offsetX }, velocity: { x: velocityX } }))

beforeEach(() => {
  slide.onDragEnd = null
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('OnboardingScreen — slides', () => {
  it('starts on the first slide', () => {
    render()
    expect(title()).toBe('Hidden entry')
    expect(container.textContent).toContain('Tap the heart')
  })

  it('shows the intro mockup instead of an emoji on a mockup slide', () => {
    render()
    expect(container.textContent).toContain('👆')
    press(t.onboardingNext)
    expect(container.textContent).not.toContain('👆')
    expect(container.textContent).toContain('📝')
  })

  it('has one dot per slide', () => {
    render()
    expect(container.querySelectorAll('button[aria-label^="Slide "]')).toHaveLength(3)
  })

  it.each(['en', 'es'])('ships real slides in %s', (language) => {
    render(COPY[language])
    expect(COPY[language].onboardingSlides.length).toBeGreaterThan(0)
    expect(title()).toBe(COPY[language].onboardingSlides[0].title)
  })
})

describe('OnboardingScreen — moving with the buttons', () => {
  it('advances one slide at a time', () => {
    render()
    press(t.onboardingNext)
    expect(title()).toBe('Add people')
    press(t.onboardingNext)
    expect(title()).toBe('See stats')
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('finishes from the last slide', () => {
    render()
    press(t.onboardingNext)
    press(t.onboardingNext)
    expect(button(t.onboardingNext)).toBeUndefined()
    press(t.onboardingDone)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('can be skipped from any slide but the last', () => {
    render()
    press(t.onboardingNext)
    press(t.onboardingSkip)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('offers no skip on the last slide', () => {
    render()
    press('Slide 3')
    expect(button(t.onboardingSkip)).toBeUndefined()
  })

  it('jumps to any slide from the dots, forwards and backwards', () => {
    render()
    press('Slide 3')
    expect(title()).toBe('See stats')
    press('Slide 1')
    expect(title()).toBe('Hidden entry')
  })
})

describe('OnboardingScreen — swiping', () => {
  it('goes forward on a firm swipe to the left', () => {
    render()
    swipe(-120, -800)
    expect(title()).toBe('Add people')
  })

  it('goes back on a firm swipe to the right', () => {
    render()
    press(t.onboardingNext)
    swipe(120, 800)
    expect(title()).toBe('Hidden entry')
  })

  it.each([
    ['is too short', -40, -5000],
    ['is too slow', -120, -10],
    ['barely reaches the distance', -50, -5000],
  ])('stays put when the swipe %s', (_case, offsetX, velocityX) => {
    render()
    swipe(offsetX, velocityX)
    expect(title()).toBe('Hidden entry')
  })

  it('does not go before the first slide', () => {
    render()
    swipe(120, 800)
    expect(title()).toBe('Hidden entry')
  })

  it('does not finish or move past the last slide by swiping', () => {
    render()
    press('Slide 3')
    swipe(-120, -800)
    expect(title()).toBe('See stats')
    expect(onComplete).not.toHaveBeenCalled()
  })
})
