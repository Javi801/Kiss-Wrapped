// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

const seen = vi.hoisted(() => ({ alertOpenChange: null, contentProps: null }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/ui/dialog', async () => {
  const { createElement } = await import('react')
  const passthrough = ({ children }) => children
  return {
    Dialog: ({ open, children }) =>
      open ? createElement('div', { 'data-dialog': true }, children) : null,
    DialogContent: ({ children, ...props }) => {
      seen.contentProps = props
      return children
    },
    DialogHeader: passthrough,
    DialogTitle: passthrough,
    DialogDescription: passthrough,
  }
})
// The confirmation renders only while open and exposes its onOpenChange handler.
vi.mock('@/components/ui/alert-dialog', async () => {
  const { createElement } = await import('react')
  const passthrough = ({ children }) => children
  return {
    AlertDialog: ({ open, onOpenChange, children }) => {
      seen.alertOpenChange = onOpenChange
      return open ? createElement('div', { 'data-alert': true }, children) : null
    },
    AlertDialogContent: passthrough,
    AlertDialogHeader: passthrough,
    AlertDialogTitle: passthrough,
    AlertDialogDescription: passthrough,
    AlertDialogFooter: passthrough,
    AlertDialogCancel: ({ children }) => createElement('button', { type: 'button' }, children),
    AlertDialogAction: ({ children, onClick }) =>
      createElement('button', { type: 'button', onClick }, children),
  }
})

import TagsDialog from '@/components/app/TagsDialog'
import {
  SETTINGS_DIALOG_CLASS,
  SETTINGS_OVERLAY_CLASS,
} from '@/components/app/settingsDialogTransition'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

const people = [
  {
    id: 'ana',
    howWeMet: 'App',
    nationality: 'chilean ',
    events: [
      { id: 'a1', place: 'Bar', situation: 'Date' },
      { id: 'a2', place: 'bar', situation: 'Date' },
    ],
  },
  { id: 'bob', howWeMet: 'App', nationality: '' },
]

const tags = {
  howWeMet: ['App', 'School'],
  nationality: ['Chilean'],
  situation: ['Date'],
  place: ['Bar', 'Park'],
}

let container
let root
let handlers

function render(props = {}) {
  handlers = {
    onOpenChange: vi.fn(),
    onRequestDelete: vi.fn(),
    onCancelDelete: vi.fn(),
    onConfirmDelete: vi.fn(),
  }
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <TagsDialog
        open
        t={t}
        people={people}
        tags={tags}
        pendingDelete={null}
        {...handlers}
        {...props}
      />
    )
  })
}

afterEach(() => {
  if (root) act(() => root.unmount())
  container?.remove()
  root = null
  seen.alertOpenChange = null
  seen.contentProps = null
})

const buttons = () => [...container.querySelectorAll('button')]
const listToggle = (label) =>
  buttons().find(
    (button) => button.hasAttribute('aria-expanded') && button.textContent.includes(label)
  )
const rowOf = (tag) =>
  [...container.querySelectorAll('li')].find((row) => row.firstChild.textContent === tag)
const deleteButton = (tag) => container.querySelector(`[aria-label="${t.deleteTag}: ${tag}"]`)
const toggle = (label) =>
  act(async () => {
    listToggle(label).click()
  })

describe('TagsDialog', () => {
  it('renders nothing while closed', () => {
    render({ open: false })
    expect(container.querySelector('[data-dialog]')).toBeNull()
  })

  it('groups the four lists under people and events, with their tag counts', () => {
    render()
    const text = container.textContent
    expect(text).toContain(t.manageTags)
    expect(text.indexOf(t.tagsPeopleSection)).toBeLessThan(text.indexOf(t.howWeMet))
    expect(text.indexOf(t.nationality)).toBeLessThan(text.indexOf(t.tagsEventsSection))
    expect(text.indexOf(t.tagsEventsSection)).toBeLessThan(text.indexOf(t.eventSituation))
    expect(listToggle(t.howWeMet).textContent).toContain('2')
    expect(listToggle(t.eventPlace).textContent).toContain('2')
  })

  it('starts with every list collapsed', () => {
    render()
    expect(container.querySelectorAll('li')).toHaveLength(0)
    for (const label of [t.howWeMet, t.nationality, t.eventSituation, t.eventPlace]) {
      expect(listToggle(label).getAttribute('aria-expanded')).toBe('false')
    }
  })

  it('expands one list at a time and collapses it again', async () => {
    render()
    await toggle(t.howWeMet)
    expect(listToggle(t.howWeMet).getAttribute('aria-expanded')).toBe('true')
    expect(rowOf('School')).toBeTruthy()

    await toggle(t.eventPlace)
    expect(listToggle(t.howWeMet).getAttribute('aria-expanded')).toBe('false')
    expect(rowOf('School')).toBeUndefined()
    expect(rowOf('Park')).toBeTruthy()

    await toggle(t.eventPlace)
    expect(container.querySelectorAll('li')).toHaveLength(0)
  })

  it('keeps the dialog at a fixed height with a column body', () => {
    render()
    expect(seen.contentProps).toHaveProperty('aria-describedby', undefined)
    expect(seen.contentProps.className.split(' ')).toEqual([
      'h-[calc(100svh-2rem)]',
      'rounded-2xl',
      SETTINGS_DIALOG_CLASS,
    ])
    expect(seen.contentProps.overlayClassName).toBe(SETTINGS_OVERLAY_CLASS)
    expect(Object.keys(seen.contentProps.style)).toEqual(['background', 'borderColor'])
    expect(seen.contentProps.showCloseButton).toBeUndefined()
    expect(seen.contentProps.bodyClassName.split(' ')).toEqual(
      expect.arrayContaining(['flex', 'flex-col'])
    )
  })

  // Lays out the lists area from y=100 to y=600 and the given header 48px tall ending at `bottom`.
  function mockLayout(label, bottom) {
    return vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.style.position === 'relative') return { top: 100, bottom: 600, height: 500 }
      if (this.style.height === '100%') return { top: 100, bottom: 600, height: 500 }
      if (this.hasAttribute('aria-expanded') && this.textContent.includes(label)) {
        return { top: bottom - 48, bottom, height: 48 }
      }
      return { top: 0, bottom: 0, height: 0 }
    })
  }

  const headersArea = () => listToggle(t.howWeMet).parentElement

  it('lays the open list over the headers, from its header to the end of the area', async () => {
    const layout = mockLayout(t.eventSituation, 300)
    render()
    await toggle(t.eventSituation)
    const list = container.querySelector('ul')
    expect(list.parentElement).toBe(headersArea().parentElement)
    expect(headersArea().contains(list)).toBe(false)
    expect(list.style.position).toBe('absolute')
    expect(list.style.zIndex).toBe('1')
    expect(list.style.top).toBe('200px')
    expect(list.style.bottom).toBe('0px')
    layout.mockRestore()
  })

  it('scrolls a header near the bottom to the top before opening its list', async () => {
    const layout = mockLayout(t.eventPlace, 580)
    render()
    await toggle(t.eventPlace)
    expect(headersArea().scrollTop).toBe(432)
    layout.mockRestore()
  })

  it('leaves the headers in place when the list has room', async () => {
    const layout = mockLayout(t.howWeMet, 200)
    render()
    await toggle(t.howWeMet)
    expect(headersArea().scrollTop).toBe(0)
    layout.mockRestore()
  })

  it('scrolls a long list inside itself, keeping the gesture inside', async () => {
    render({ tags: { ...tags, place: Array.from({ length: 40 }, (_, i) => `Tag ${i}`) } })
    await toggle(t.eventPlace)
    const list = container.querySelector('ul')
    expect(list.style.overflowY).toBe('auto')
    expect(list.style.overscrollBehavior).toBe('contain')
    expect(list.querySelectorAll('li')).toHaveLength(40)
  })

  it('holds the headers still only while a list is open', async () => {
    render()
    expect(headersArea().style.overflowY).toBe('auto')
    await toggle(t.howWeMet)
    expect(headersArea().style.overflowY).toBe('hidden')
    await toggle(t.howWeMet)
    expect(headersArea().style.overflowY).toBe('auto')
  })

  it('places the open list again when the window is resized', async () => {
    const layout = mockLayout(t.howWeMet, 200)
    render()
    await toggle(t.howWeMet)
    expect(container.querySelector('ul').style.top).toBe('100px')
    layout.mockRestore()
    const moved = mockLayout(t.howWeMet, 250)
    act(() => window.dispatchEvent(new Event('resize')))
    expect(container.querySelector('ul').style.top).toBe('150px')
    moved.mockRestore()
  })

  it('counts the uses of person fields, ignoring case and spaces', async () => {
    render()
    await toggle(t.howWeMet)
    expect(rowOf('App').textContent).toContain(`2 ${t.tagUses}`)
    expect(rowOf('School').textContent).toContain(t.tagUnused)

    await toggle(t.nationality)
    expect(rowOf('Chilean').textContent).toContain(`1 ${t.tagUse}`)
  })

  it('counts the uses of event fields across all events', async () => {
    render()
    await toggle(t.eventPlace)
    expect(rowOf('Bar').textContent).toContain(`2 ${t.tagUses}`)
    expect(rowOf('Park').textContent).toContain(t.tagUnused)

    await toggle(t.eventSituation)
    expect(rowOf('Date').textContent).toContain(`2 ${t.tagUses}`)
  })

  it('treats people without events as having no event values', async () => {
    render({ people: [{ id: 'bob' }] })
    await toggle(t.eventPlace)
    expect(rowOf('Bar').textContent).toContain(t.tagUnused)
  })

  it('offers delete for every tag, used or not', async () => {
    render()
    await toggle(t.howWeMet)
    expect(deleteButton('App')).not.toBeNull()
    expect(deleteButton('School')).not.toBeNull()
  })

  it('requests the delete with the field of the list and the use count', async () => {
    render()
    await toggle(t.eventPlace)
    await act(async () => deleteButton('Park').click())
    expect(handlers.onRequestDelete).toHaveBeenCalledWith('place', 'Park', 0)
    await act(async () => deleteButton('Bar').click())
    expect(handlers.onRequestDelete).toHaveBeenLastCalledWith('place', 'Bar', 2)
  })

  it('shows a placeholder for an empty list', async () => {
    render({ tags: { ...tags, nationality: [] } })
    await toggle(t.nationality)
    expect(container.querySelector('li').textContent).toBe(t.noTags)
  })

  it('asks for no confirmation while no delete is pending', () => {
    render()
    expect(container.querySelector('[data-alert]')).toBeNull()
  })

  const alertText = () => container.querySelector('[data-alert]').textContent
  const alertButton = (label) =>
    [...container.querySelectorAll('[data-alert] button')].find(
      (button) => button.textContent === label
    )

  it('asks for a plain confirmation of an unused tag, naming it', () => {
    render({ pendingDelete: { field: 'place', tag: 'Park', count: 0 } })
    expect(alertText()).toContain(t.deleteTagConfirmTitle)
    expect(alertText()).toContain('Park')
    expect(alertText()).toContain(t.deleteTagConfirmDesc)
    expect(alertText()).not.toContain(t.deleteTagInUse)
    expect(alertButton(t.deleteTagConfirmAction)).toBeTruthy()
  })

  it('warns how many events use a tag and what deleting it does', () => {
    render({ pendingDelete: { field: 'place', tag: 'Bar', count: 2 } })
    expect(alertText()).toContain(`${t.deleteTagInUse} 2 ${t.tagEvents}.`)
    expect(alertText()).toContain(t.deleteTagInUseEventsDesc)
    expect(alertText()).toContain(t.deleteTagInUseRequired)
    expect(alertText()).not.toContain(t.deleteTagConfirmDesc)
    expect(alertButton(t.deleteTagAnywayAction)).toBeTruthy()
  })

  it('uses the singular for a single event', () => {
    render({ pendingDelete: { field: 'situation', tag: 'Date', count: 1 } })
    expect(alertText()).toContain(`${t.deleteTagInUse} 1 ${t.tagEvent}.`)
  })

  it('warns how many people use a required person tag', () => {
    render({ pendingDelete: { field: 'howWeMet', tag: 'App', count: 2 } })
    expect(alertText()).toContain(`${t.deleteTagInUse} 2 ${t.tagPeople}.`)
    expect(alertText()).toContain(t.deleteTagInUsePeopleDesc)
    expect(alertText()).toContain(t.deleteTagInUseRequired)
  })

  it('does not mention incomplete records for the optional nationality', () => {
    render({ pendingDelete: { field: 'nationality', tag: 'Chilean', count: 1 } })
    expect(alertText()).toContain(`${t.deleteTagInUse} 1 ${t.tagPerson}.`)
    expect(alertText()).toContain(t.deleteTagInUsePeopleDesc)
    expect(alertText()).not.toContain(t.deleteTagInUseRequired)
  })

  it('confirms the pending delete', async () => {
    render({ pendingDelete: { field: 'place', tag: 'Bar', count: 2 } })
    await act(async () => alertButton(t.deleteTagAnywayAction).click())
    expect(handlers.onConfirmDelete).toHaveBeenCalledOnce()
  })

  it('cancels the pending delete when the confirmation closes', () => {
    render({ pendingDelete: { field: 'place', tag: 'Park', count: 0 } })
    act(() => seen.alertOpenChange(true))
    expect(handlers.onCancelDelete).not.toHaveBeenCalled()
    act(() => seen.alertOpenChange(false))
    expect(handlers.onCancelDelete).toHaveBeenCalledOnce()
  })
})
