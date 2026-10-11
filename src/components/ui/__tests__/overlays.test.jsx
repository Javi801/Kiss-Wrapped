// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

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

const slot = (name) => document.body.querySelector(`[data-slot="${name}"]`)

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('DialogContent', () => {
  function renderDialog(props = {}) {
    render(
      <Dialog open>
        <DialogContent {...props}>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
          <input data-testid="field" />
        </DialogContent>
      </Dialog>
    )
  }

  it('focuses the dialog itself on open instead of its first field', () => {
    renderDialog()
    expect(document.activeElement).toBe(slot('dialog-content'))
  })

  it('lets a caller choose its own focus on open', () => {
    const onOpenAutoFocus = vi.fn((event) => {
      event.preventDefault()
      document.body.querySelector('[data-testid="field"]').focus()
    })
    renderDialog({ onOpenAutoFocus })
    expect(onOpenAutoFocus).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(document.body.querySelector('[data-testid="field"]'))
  })

  it('puts the children in a scrollable body and keeps the close button out of it', () => {
    renderDialog()
    const body = slot('dialog-body')
    expect(body.parentElement).toBe(slot('dialog-content'))
    expect(body.querySelector('[data-testid="field"]')).not.toBeNull()
    expect(body.className).toContain('overflow-y-auto')
    expect(slot('dialog-close')).not.toBeNull()
    expect(body.contains(slot('dialog-close'))).toBe(false)
  })

  it('omits the close button when asked to', () => {
    renderDialog({ showCloseButton: false })
    expect(slot('dialog-close')).toBeNull()
  })

  it('passes the class names to the content and the overlay separately', () => {
    renderDialog({ className: 'z-[10003]', overlayClassName: 'z-[10002]' })
    const content = slot('dialog-content').className.split(' ')
    const overlay = slot('dialog-overlay').className.split(' ')
    expect(content).toContain('z-[10003]')
    expect(content).not.toContain('z-50')
    expect(overlay).toContain('z-[10002]')
    expect(overlay).not.toContain('z-50')
    expect(overlay).not.toContain('z-[10003]')
  })

  it('passes the overlay style to the overlay only', () => {
    renderDialog({ overlayStyle: { backgroundColor: 'rgb(1, 2, 3)' } })
    expect(slot('dialog-overlay').style.backgroundColor).toBe('rgb(1, 2, 3)')
    expect(slot('dialog-content').style.backgroundColor).toBe('')
  })

  it('combines the overlay style with the overlay class name', () => {
    renderDialog({ overlayClassName: 'z-[10002]', overlayStyle: { opacity: 0.5 } })
    expect(slot('dialog-overlay').className.split(' ')).toContain('z-[10002]')
    expect(slot('dialog-overlay').style.opacity).toBe('0.5')
  })

  it('leaves the overlay color to its class names by default', () => {
    renderDialog()
    expect(slot('dialog-overlay').style.backgroundColor).toBe('')
  })

  it('keeps the default layer when no class names are given', () => {
    renderDialog()
    expect(slot('dialog-content').className.split(' ')).toContain('z-50')
    expect(slot('dialog-overlay').className.split(' ')).toContain('z-50')
  })

  it('renders nothing while closed', () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(slot('dialog-content')).toBeNull()
  })
})

describe('SheetContent', () => {
  function renderSheet(props = {}) {
    render(
      <Sheet open>
        <SheetContent {...props}>
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
          <input data-testid="field" />
        </SheetContent>
      </Sheet>
    )
  }

  it('focuses the sheet itself on open instead of its first field', () => {
    renderSheet()
    expect(document.activeElement).toBe(slot('sheet-content'))
  })

  it('lets a caller choose its own focus on open', () => {
    const onOpenAutoFocus = vi.fn((event) => {
      event.preventDefault()
      document.body.querySelector('[data-testid="field"]').focus()
    })
    renderSheet({ onOpenAutoFocus })
    expect(onOpenAutoFocus).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(document.body.querySelector('[data-testid="field"]'))
  })

  it('opens on the right by default and on the requested side otherwise', () => {
    renderSheet()
    expect(slot('sheet-content').dataset.side).toBe('right')
    act(() => root.unmount())
    container.remove()

    renderSheet({ side: 'bottom' })
    expect(slot('sheet-content').dataset.side).toBe('bottom')
  })
})
