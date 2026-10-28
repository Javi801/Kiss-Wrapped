// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

const seen = vi.hoisted(() => ({ alertOpenChange: null }))

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
    expect(text).toContain(t.tagsIntro)
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
