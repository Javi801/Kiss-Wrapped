// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

const mockFilesystem = vi.hoisted(() => ({
  writeFile: vi.fn(),
  deleteFile: vi.fn(),
  getUri: vi.fn(),
}))
const mockShare = vi.hoisted(() => ({ share: vi.fn() }))
const mockCapacitor = vi.hoisted(() => ({ getPlatform: () => 'android' }))

vi.mock('@capacitor/core', () => ({ Capacitor: mockCapacitor }))
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: mockFilesystem,
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
}))
vi.mock('@capacitor/share', () => ({ Share: mockShare }))

import ErrorBoundary from '@/components/app/ErrorBoundary'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function Boom({ error = new Error('kaboom') }) {
  throw error
}

let container
let root

function render(children) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<ErrorBoundary>{children}</ErrorBoundary>)
  })
}

const buttons = () => [...container.querySelectorAll('button')]
const shareButton = () => buttons()[0]
const clickShare = () =>
  act(async () => {
    shareButton().dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
const writtenReport = () => mockFilesystem.writeFile.mock.calls[0][0]

beforeEach(() => {
  vi.clearAllMocks()
  mockCapacitor.getPlatform = () => 'android'
  mockFilesystem.writeFile.mockResolvedValue(undefined)
  mockFilesystem.deleteFile.mockResolvedValue(undefined)
  mockFilesystem.getUri.mockResolvedValue({ uri: 'file:///mock/crash.txt' })
  mockShare.share.mockResolvedValue(undefined)
  // React reports caught render errors to the console.
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US')
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

describe('ErrorBoundary — rendering', () => {
  it('renders its children when nothing fails', () => {
    render(<span>all good</span>)
    expect(container.innerHTML).toBe('<span>all good</span>')
  })

  it('replaces a crashing tree with the crash screen', () => {
    render(<Boom />)
    expect(container.textContent).toContain(COPY.en.crashTitle)
    expect(container.textContent).toContain(COPY.en.crashDesc)
    expect(buttons().map((button) => button.textContent)).toEqual([
      COPY.en.crashShare,
      COPY.en.crashReload,
    ])
  })

  it('uses the device language for the crash screen', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-CL')
    render(<Boom />)
    expect(container.textContent).toContain(COPY.es.crashTitle)
    expect(shareButton().textContent).toBe(COPY.es.crashShare)
  })

  it('falls back to English when the device language cannot be read', () => {
    vi.spyOn(navigator, 'language', 'get').mockImplementation(() => {
      throw new Error('no navigator')
    })
    render(<Boom />)
    expect(container.textContent).toContain(COPY.en.crashTitle)
  })
})

describe('ErrorBoundary — sharing the crash log', () => {
  it('writes a crash report with the error, platform and stack to the cache', async () => {
    const error = new Error('kaboom')
    render(<Boom error={error} />)
    await clickShare()

    const report = writtenReport()
    expect(report.directory).toBe('CACHE')
    expect(report.path).toMatch(/^kiss-wrapped-crash-\d{4}-\d{2}-\d{2}\.txt$/)
    expect(report.data).toContain('Error: kaboom')
    expect(report.data).toContain('Platform: android')
    expect(report.data).toContain(error.stack)
    expect(report.data).toContain('Boom')
  })

  it('shares the written file and then removes it', async () => {
    render(<Boom />)
    await clickShare()
    expect(mockShare.share).toHaveBeenCalledWith({ files: ['file:///mock/crash.txt'] })
    expect(mockFilesystem.deleteFile).toHaveBeenCalledWith({
      path: writtenReport().path,
      directory: 'CACHE',
    })
  })

  it('reports an unknown platform when Capacitor cannot tell', async () => {
    mockCapacitor.getPlatform = undefined
    render(<Boom />)
    await clickShare()
    expect(writtenReport().data).toContain('Platform: unknown')
  })

  it('describes a thrown value that is not an Error', async () => {
    render(<Boom error="plain failure" />)
    await clickShare()
    expect(writtenReport().data).toContain('Error: plain failure')
    expect(writtenReport().data).toContain('(no stack trace available)')
  })

  it('disables the share button while sharing and restores it afterwards', async () => {
    let finishShare
    mockShare.share.mockReturnValue(new Promise((resolve) => (finishShare = resolve)))
    render(<Boom />)

    await clickShare()
    expect(shareButton().disabled).toBe(true)
    expect(shareButton().textContent).not.toBe(COPY.en.crashShare)

    await act(async () => finishShare())
    expect(shareButton().disabled).toBe(false)
    expect(shareButton().textContent).toBe(COPY.en.crashShare)
  })

  it('recovers when the log cannot be written', async () => {
    mockFilesystem.writeFile.mockRejectedValue(new Error('disk full'))
    render(<Boom />)
    await clickShare()
    expect(mockShare.share).not.toHaveBeenCalled()
    expect(shareButton().disabled).toBe(false)
    expect(container.textContent).toContain(COPY.en.crashTitle)
  })

  it('recovers when the share sheet is dismissed', async () => {
    mockShare.share.mockRejectedValue(new Error('Share canceled'))
    render(<Boom />)
    await clickShare()
    expect(shareButton().disabled).toBe(false)
    expect(mockFilesystem.deleteFile).not.toHaveBeenCalled()
  })

  it('ignores a failed cleanup of the temp file', async () => {
    mockFilesystem.deleteFile.mockRejectedValue(new Error('gone'))
    render(<Boom />)
    await clickShare()
    expect(shareButton().disabled).toBe(false)
    expect(mockShare.share).toHaveBeenCalledOnce()
  })
})
