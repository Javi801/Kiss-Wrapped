// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/ui/dialog', async () => {
  const { createElement } = await import('react')
  const passthrough = ({ children }) => children
  return {
    Dialog: ({ open, children }) =>
      open ? createElement('div', { 'data-dialog': true }, children) : null,
    DialogContent: passthrough,
    DialogHeader: passthrough,
    DialogTitle: passthrough,
    DialogDescription: passthrough,
    DialogFooter: passthrough,
  }
})

import AppGuideDialog from '@/components/app/AppGuideDialog'
import AppGuideSection from '@/components/app/AppGuideSection'
import { APP_GUIDE_SECTIONS } from '@/components/app/appGuideSections'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

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

afterEach(() => {
  if (root) act(() => root.unmount())
  container?.remove()
  root = null
})

describe('APP_GUIDE_SECTIONS', () => {
  it('gives every section a unique id, an icon and at least one text', () => {
    const ids = APP_GUIDE_SECTIONS.map((section) => section.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const section of APP_GUIDE_SECTIONS) {
      expect(section.icon).toBeTruthy()
      expect(section.items.length).toBeGreaterThan(0)
    }
  })

  it.each(Object.keys(COPY))('has every text in %s', (language) => {
    for (const section of APP_GUIDE_SECTIONS) {
      for (const key of [section.title, ...section.items]) {
        expect(COPY[language][key], key).toEqual(expect.any(String))
        expect(COPY[language][key]).not.toBe('')
      }
    }
  })
})

describe('AppGuideDialog', () => {
  it('renders nothing while closed', () => {
    render(<AppGuideDialog open={false} onOpenChange={() => {}} t={t} />)
    expect(container.querySelector('[data-dialog]')).toBeNull()
  })

  it('shows the title, the intro and every section in order', () => {
    render(<AppGuideDialog open onOpenChange={() => {}} t={t} />)
    expect(container.textContent).toContain(t.appGuide)
    expect(container.textContent).toContain(t.appGuideIntro)
    expect([...container.querySelectorAll('h3')].map((title) => title.textContent)).toEqual(
      APP_GUIDE_SECTIONS.map((section) => t[section.title])
    )
    for (const section of APP_GUIDE_SECTIONS) {
      for (const item of section.items) expect(container.textContent).toContain(t[item])
    }
  })

  it('closes from its button', () => {
    const onOpenChange = vi.fn()
    render(<AppGuideDialog open onOpenChange={onOpenChange} t={t} />)
    act(() => container.querySelector('button').click())
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('AppGuideSection', () => {
  const Icon = () => <svg />

  it('shows a single text as a paragraph', () => {
    render(<AppGuideSection icon={Icon} title="Title" items={['Only text']} />)
    expect(container.querySelector('h3').textContent).toBe('Title')
    expect(container.querySelector('p').textContent).toBe('Only text')
    expect(container.querySelector('ul')).toBeNull()
  })

  it('shows several texts as a list', () => {
    render(<AppGuideSection icon={Icon} title="Title" items={['One', 'Two']} />)
    expect([...container.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      'One',
      'Two',
    ])
    expect(container.querySelector('p')).toBeNull()
  })
})
