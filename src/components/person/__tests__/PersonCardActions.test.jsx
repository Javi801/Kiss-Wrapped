// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

vi.mock('@/lib/theme', () => ({
  usePalette: () => ({ warningBorder: 'rgb(255, 170, 0)' }),
}))
vi.mock('@/components/ui/alert-dialog', async () => {
  const { createElement } = await import('react')
  const passthrough = ({ children }) => children
  return {
    AlertDialog: passthrough,
    AlertDialogTrigger: passthrough,
    AlertDialogContent: passthrough,
    AlertDialogHeader: passthrough,
    AlertDialogFooter: passthrough,
    AlertDialogTitle: () => null,
    AlertDialogDescription: () => null,
    AlertDialogCancel: () => null,
    AlertDialogAction: ({ onClick, children }) =>
      createElement('button', { type: 'button', onClick }, children),
  }
})

import PersonCardActions from '@/components/person/PersonCardActions'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

let container
let root
let handlers

function render(props = {}) {
  handlers = {
    onEditPerson: vi.fn(),
    onAddEvent: vi.fn(),
    onDeletePerson: vi.fn(),
    onDeleteAllEvents: vi.fn(),
  }
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<PersonCardActions hasEvents={false} t={t} {...handlers} {...props} />)
  })
}

const button = (label) =>
  [...container.querySelectorAll('button')].find((item) => item.textContent === label)
const click = (label) => act(() => button(label).click())

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('PersonCardActions', () => {
  it('highlights the edit button when the profile is incomplete', () => {
    render({ personIncomplete: true })
    expect(button(t.editPerson).style.border).toBe('2px solid rgb(255, 170, 0)')
  })

  it('leaves the edit button without a border when the profile is complete', () => {
    render({ personIncomplete: false })
    expect(button(t.editPerson).style.borderStyle).toBe('none')
  })

  it('never highlights the add-event button', () => {
    render({ personIncomplete: true })
    expect(button(t.addEvent).style.borderStyle).toBe('none')
  })

  it('reports the edit and add-event buttons', () => {
    render()
    click(t.editPerson)
    click(t.addEvent)
    expect(handlers.onEditPerson).toHaveBeenCalledOnce()
    expect(handlers.onAddEvent).toHaveBeenCalledOnce()
  })

  it('deletes the person once the confirmation is accepted', () => {
    render()
    click(t.deletePersonConfirmAction)
    expect(handlers.onDeletePerson).toHaveBeenCalledOnce()
    expect(handlers.onDeleteAllEvents).not.toHaveBeenCalled()
  })

  it('offers to delete all events only when there are events', () => {
    render({ hasEvents: false })
    expect(button(t.deleteAllEvents)).toBeUndefined()
  })

  it('deletes all events once the confirmation is accepted', () => {
    render({ hasEvents: true })
    click(t.deleteAllEventsConfirmAction)
    expect(handlers.onDeleteAllEvents).toHaveBeenCalledOnce()
    expect(handlers.onDeletePerson).not.toHaveBeenCalled()
  })
})

describe('PersonCardActions — onboarding guide', () => {
  const addEvent = () =>
    [...container.querySelectorAll('button')].find((item) => item.textContent.includes(t.addEvent))

  it('shows no hint and no tap guide by default', () => {
    render()
    expect(container.querySelector('[role="note"]')).toBeNull()
    expect(container.textContent).not.toContain('👆')
    expect(addEvent().style.pointerEvents).toBe('')
  })

  it('shows the edit hint as a note above the buttons', () => {
    render({ editHint: 'About editing' })
    const note = container.querySelector('[role="note"]')
    expect(note.textContent).toBe('About editing')
    expect(note.compareDocumentPosition(button(t.editPerson))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )
  })

  it('puts the tap guide on the add-event button and keeps it tappable', () => {
    render({ showTapGuide: true })
    expect(addEvent().textContent).toContain('👆')
    expect(addEvent().style.pointerEvents).toBe('auto')
    act(() => addEvent().click())
    expect(handlers.onAddEvent).toHaveBeenCalledOnce()
  })
})
