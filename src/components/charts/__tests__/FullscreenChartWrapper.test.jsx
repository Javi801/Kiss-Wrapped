// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

const mockToPng = vi.hoisted(() => vi.fn())
const mockFilesystem = vi.hoisted(() => ({
  writeFile: vi.fn(),
  deleteFile: vi.fn(),
  getUri: vi.fn(),
}))
const mockShare = vi.hoisted(() => ({ share: vi.fn() }))
const mockCapacitor = vi.hoisted(() => ({ getPlatform: () => 'android' }))

vi.mock('html-to-image', () => ({ toPng: mockToPng }))
vi.mock('@capacitor/core', () => ({ Capacitor: mockCapacitor }))
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: mockFilesystem,
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
}))
vi.mock('@capacitor/share', () => ({ Share: mockShare }))
vi.mock('@/lib/theme', () => ({ usePalette: () => ({ cardBg: '#fafafa' }) }))

import FullscreenChartWrapper from '@/components/charts/FullscreenChartWrapper'
import { useFullscreen } from '@/components/charts/FullscreenContext'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// The wrapper reads its copy from context; outside a provider that is English.
const t = COPY.en

// A chart stand-in with a scroll area that clips its content.
function Chart() {
  const isFullscreen = useFullscreen()
  return (
    <div data-testid="chart" data-fullscreen={String(isFullscreen)}>
      <div data-testid="scroll" style={{ overflow: 'auto', maxHeight: '100px', height: '80px' }}>
        rows
      </div>
    </div>
  )
}

let container
let root

function render(props = {}) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <FullscreenChartWrapper {...props}>
        <Chart />
      </FullscreenChartWrapper>
    )
  })
}

const byTitle = (title) => document.body.querySelector(`button[title="${title}"]`)
const chartNode = () => document.body.querySelector('[data-testid="chart"]')
const scrollArea = () => document.body.querySelector('[data-testid="scroll"]')
const capture = () => document.body.querySelector('[data-fullscreen-chart]')
const isFullscreen = () => capture() !== null
const errorDialog = () => document.body.querySelector('[role="dialog"]')
const dialogButton = (label) =>
  [...errorDialog().querySelectorAll('button')].find((button) => button.textContent === label)
const logButton = () => dialogButton(t.chartShareLog)
const openFullscreen = () => act(() => byTitle(t.chartFullscreen).click())
const pressKey = (key) => act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key })))

// Starts a download and lets its layout delay and promises finish.
async function download() {
  act(() => byTitle(t.chartDownloadImage).click())
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mockCapacitor.getPlatform = () => 'android'
  mockToPng.mockResolvedValue('data:image/png;base64,PNGDATA')
  mockFilesystem.writeFile.mockResolvedValue(undefined)
  mockFilesystem.deleteFile.mockResolvedValue(undefined)
  mockFilesystem.getUri.mockResolvedValue({ uri: 'file:///mock/chart.png' })
  mockShare.share.mockResolvedValue(undefined)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  document.body.style.overflow = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('FullscreenChartWrapper — inline', () => {
  it('renders the chart in place with a fullscreen button', () => {
    render()
    expect(container.querySelector('[data-testid="chart"]')).not.toBeNull()
    expect(byTitle(t.chartFullscreen)).not.toBeNull()
    expect(isFullscreen()).toBe(false)
  })

  it('tells the chart it is not in fullscreen', () => {
    render()
    expect(chartNode().dataset.fullscreen).toBe('false')
  })

  it('offers no download outside fullscreen', () => {
    render()
    expect(byTitle(t.chartDownloadImage)).toBeNull()
  })
})

describe('FullscreenChartWrapper — fullscreen', () => {
  it('moves the chart to a full-page layer and tells it so', () => {
    render()
    openFullscreen()
    expect(isFullscreen()).toBe(true)
    expect(container.querySelector('[data-testid="chart"]')).toBeNull()
    expect(capture().contains(chartNode())).toBe(true)
    expect(chartNode().dataset.fullscreen).toBe('true')
  })

  it('adds the app watermark to what gets captured', () => {
    render()
    openFullscreen()
    expect(capture().querySelector('[data-fullscreen-watermark]').textContent).toBe('Kiss Wrapped')
  })

  it('locks the page scroll while open and restores it on close', () => {
    document.body.style.overflow = 'scroll'
    render()
    openFullscreen()
    expect(document.body.style.overflow).toBe('hidden')
    act(() => byTitle(t.close).click())
    expect(isFullscreen()).toBe(false)
    expect(document.body.style.overflow).toBe('scroll')
    expect(container.querySelector('[data-testid="chart"]')).not.toBeNull()
  })

  it('closes on Escape only', () => {
    render()
    openFullscreen()
    pressKey('Enter')
    expect(isFullscreen()).toBe(true)
    pressKey('Escape')
    expect(isFullscreen()).toBe(false)
  })

  it('restores the page scroll if removed while open', () => {
    render()
    openFullscreen()
    act(() => root.render(null))
    expect(document.body.style.overflow).toBe('')
  })

  it('centers the content only when asked to', () => {
    render()
    openFullscreen()
    expect(capture().hasAttribute('data-center-content')).toBe(false)
    act(() => root.unmount())
    container.remove()
    render({ centerContent: true })
    openFullscreen()
    expect(capture().dataset.centerContent).toBe('true')
  })
})

describe('FullscreenChartWrapper — downloading the image', () => {
  it('captures the fullscreen content at double resolution on the card background', async () => {
    render()
    openFullscreen()
    await download()
    expect(mockToPng).toHaveBeenCalledOnce()
    const [element, options] = mockToPng.mock.calls[0]
    expect(element).toBe(capture())
    expect(options).toMatchObject({ pixelRatio: 2, backgroundColor: '#fafafa' })
  })

  it('captures the whole content, not just the visible part', async () => {
    render()
    openFullscreen()
    vi.spyOn(capture(), 'scrollWidth', 'get').mockReturnValue(1200)
    vi.spyOn(capture(), 'scrollHeight', 'get').mockReturnValue(900.4)
    await download()
    expect(mockToPng.mock.calls[0][1]).toMatchObject({ width: 1200, height: 901 })
  })

  it('writes the image to the cache as a dated PNG and shares it', async () => {
    render()
    openFullscreen()
    await download()
    const written = mockFilesystem.writeFile.mock.calls[0][0]
    expect(written).toMatchObject({ directory: 'CACHE', data: 'PNGDATA' })
    expect(written.path).toMatch(/^kiss-wrapped-chart-\d{4}-\d{2}-\d{2}\.png$/)
    expect(mockShare.share).toHaveBeenCalledWith({ files: ['file:///mock/chart.png'] })
    expect(mockFilesystem.deleteFile).toHaveBeenCalledWith({
      path: written.path,
      directory: 'CACHE',
    })
    expect(errorDialog()).toBeNull()
  })

  it('unclips scroll areas for the capture and restores them afterwards', async () => {
    let during
    mockToPng.mockImplementation(async () => {
      const { overflow, maxHeight, height } = scrollArea().style
      during = { overflow, maxHeight, height }
      return 'data:image/png;base64,PNGDATA'
    })
    render()
    openFullscreen()
    await download()
    expect(during).toEqual({ overflow: 'visible', maxHeight: 'none', height: 'auto' })
    expect(scrollArea().style.overflow).toBe('auto')
    expect(scrollArea().style.maxHeight).toBe('100px')
    expect(scrollArea().style.height).toBe('80px')
  })

  it('ignores a second tap while a download is running', async () => {
    let finish
    mockToPng.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    render()
    openFullscreen()
    await download()
    expect(byTitle(t.chartDownloadImage).disabled).toBe(true)
    await download()
    expect(mockToPng).toHaveBeenCalledOnce()

    await act(async () => finish('data:image/png;base64,PNGDATA'))
    expect(byTitle(t.chartDownloadImage).disabled).toBe(false)
  })

  it('ignores a failed cleanup of the temp file', async () => {
    mockFilesystem.deleteFile.mockRejectedValue(new Error('gone'))
    render()
    openFullscreen()
    await download()
    expect(errorDialog()).toBeNull()
  })
})

describe('FullscreenChartWrapper — download errors', () => {
  it('shows the reason and restores the chart when the capture fails', async () => {
    mockToPng.mockRejectedValue(new Error('canvas too large'))
    render()
    openFullscreen()
    await download()
    expect(errorDialog().textContent).toContain('Error: canvas too large')
    expect(mockShare.share).not.toHaveBeenCalled()
    expect(scrollArea().style.maxHeight).toBe('100px')
    expect(byTitle(t.chartDownloadImage).disabled).toBe(false)
  })

  it('shows the reason when sharing fails', async () => {
    mockShare.share.mockRejectedValue(new Error('Share canceled'))
    render()
    openFullscreen()
    await download()
    expect(errorDialog().textContent).toContain('Error: Share canceled')
  })

  it('describes a failure that is not an Error', async () => {
    mockToPng.mockRejectedValue('plain failure')
    render()
    openFullscreen()
    await download()
    expect(errorDialog().textContent).toContain('Error: plain failure')
  })

  it('clears the error on the next attempt', async () => {
    mockToPng.mockRejectedValueOnce(new Error('canvas too large'))
    render()
    openFullscreen()
    await download()
    await download()
    expect(errorDialog()).toBeNull()
    expect(mockShare.share).toHaveBeenCalledOnce()
  })

  it('closes the error with its close button and keeps the chart open', async () => {
    mockToPng.mockRejectedValue(new Error('canvas too large'))
    render()
    openFullscreen()
    await download()
    expect(errorDialog().textContent).toContain(t.chartDownloadErrorTitle)
    act(() => dialogButton(t.close).click())
    expect(errorDialog()).toBeNull()
    expect(isFullscreen()).toBe(true)
  })

  it('clears the error when fullscreen is reopened', async () => {
    mockToPng.mockRejectedValue(new Error('canvas too large'))
    render()
    openFullscreen()
    await download()
    act(() => byTitle(t.close).click())
    openFullscreen()
    expect(errorDialog()).toBeNull()
  })

  describe('sharing the error log', () => {
    const shareLog = () =>
      act(async () => {
        logButton().click()
      })
    const log = () => mockFilesystem.writeFile.mock.calls.at(-1)[0]

    async function failDownload(error = new Error('canvas too large')) {
      mockToPng.mockRejectedValue(error)
      render()
      openFullscreen()
      await download()
      mockFilesystem.writeFile.mockClear()
      mockShare.share.mockClear()
      mockFilesystem.deleteFile.mockClear()
    }

    it('writes a dated report with the error, platform and stack, then shares it', async () => {
      const error = new Error('canvas too large')
      await failDownload(error)
      expect(logButton()).toBeDefined()
      await shareLog()

      expect(log().directory).toBe('CACHE')
      expect(log().path).toMatch(/^kiss-wrapped-export-error-\d{4}-\d{2}-\d{2}\.txt$/)
      expect(log().data).toContain('Error: canvas too large')
      expect(log().data).toContain('Platform: android')
      expect(log().data).toContain(error.stack)
      expect(mockShare.share).toHaveBeenCalledWith({ files: ['file:///mock/chart.png'] })
      expect(mockFilesystem.deleteFile).toHaveBeenCalledWith({
        path: log().path,
        directory: 'CACHE',
      })
    })

    it('reports an unknown platform and a missing stack', async () => {
      mockCapacitor.getPlatform = undefined
      await failDownload('plain failure')
      await shareLog()
      expect(log().data).toContain('Platform: unknown')
      expect(log().data).toContain('Error: plain failure')
      expect(log().data).toContain('(no stack trace available)')
    })

    it('disables the button while sharing and restores it afterwards', async () => {
      await failDownload()
      let finish
      mockShare.share.mockReturnValue(new Promise((resolve) => (finish = resolve)))
      await shareLog()
      expect(logButton().disabled).toBe(true)
      await act(async () => finish())
      expect(logButton().disabled).toBe(false)
    })

    it('recovers when the log cannot be written or shared', async () => {
      await failDownload()
      mockFilesystem.writeFile.mockRejectedValue(new Error('disk full'))
      await shareLog()
      expect(mockShare.share).not.toHaveBeenCalled()
      expect(logButton().disabled).toBe(false)
    })

    it('ignores a failed cleanup of the log file', async () => {
      await failDownload()
      mockFilesystem.deleteFile.mockRejectedValue(new Error('gone'))
      await shareLog()
      expect(mockShare.share).toHaveBeenCalledOnce()
      expect(logButton().disabled).toBe(false)
    })
  })
})

describe('FullscreenChartWrapper — custom expanded view', () => {
  // An expanded view stand-in with a scroll area that clips its content.
  const story = (
    <div data-testid="story">
      <div data-testid="story-scroll" style={{ overflow: 'auto', maxHeight: '100px' }}>
        story
      </div>
    </div>
  )
  const stage = () => document.body.querySelector('[data-expanded-view]')
  const storyNode = () => document.body.querySelector('[data-testid="story"]')
  const storyScroll = () => document.body.querySelector('[data-testid="story-scroll"]')
  const layer = () => [...document.body.children].find((node) => node !== container)

  it('keeps the chart in place until fullscreen opens', () => {
    render({ expandedView: story })
    expect(container.querySelector('[data-testid="chart"]')).not.toBeNull()
    expect(storyNode()).toBeNull()
  })

  it('shows the expanded view instead of the chart in fullscreen', () => {
    render({ expandedView: story })
    openFullscreen()
    expect(stage().contains(storyNode())).toBe(true)
    expect(chartNode()).toBeNull()
    expect(capture()).toBeNull()
  })

  it('adds no watermark', () => {
    render({ expandedView: story })
    openFullscreen()
    expect(document.body.querySelector('[data-fullscreen-watermark]')).toBeNull()
  })

  it('scales a parent to fit the screen and leaves the captured node at full size', () => {
    render({ expandedView: story })
    openFullscreen()
    expect(stage().style.width).toBe('1080px')
    expect(stage().style.height).toBe('1920px')
    expect(stage().style.transform).toBe('')
    expect(stage().parentElement.style.transform).toMatch(/^scale\(/)
  })

  it('captures the expanded view at 1080 × 1920 without upscaling', async () => {
    render({ expandedView: story })
    openFullscreen()
    await download()
    expect(mockToPng).toHaveBeenCalledOnce()
    const [element, options] = mockToPng.mock.calls[0]
    expect(element).toBe(stage())
    expect(options).toMatchObject({ width: 1080, height: 1920, pixelRatio: 1 })
  })

  it('leaves scroll areas clipped during the capture', async () => {
    let during
    mockToPng.mockImplementation(async () => {
      const { overflow, maxHeight } = storyScroll().style
      during = { overflow, maxHeight }
      return 'data:image/png;base64,PNGDATA'
    })
    render({ expandedView: story })
    openFullscreen()
    await download()
    expect(during).toEqual({ overflow: 'auto', maxHeight: '100px' })
  })

  it('shares the image under the usual dated name', async () => {
    render({ expandedView: story })
    openFullscreen()
    await download()
    const written = mockFilesystem.writeFile.mock.calls[0][0]
    expect(written.path).toMatch(/^kiss-wrapped-chart-\d{4}-\d{2}-\d{2}\.png$/)
    expect(mockShare.share).toHaveBeenCalledWith({ files: ['file:///mock/chart.png'] })
  })

  it('shows the reason when the capture fails', async () => {
    mockToPng.mockRejectedValue(new Error('canvas too large'))
    render({ expandedView: story })
    openFullscreen()
    await download()
    expect(errorDialog().textContent).toContain('Error: canvas too large')
  })

  it('closes with the close button and on Escape', () => {
    render({ expandedView: story })
    openFullscreen()
    act(() => byTitle(t.close).click())
    expect(stage()).toBeNull()
    expect(container.querySelector('[data-testid="chart"]')).not.toBeNull()

    openFullscreen()
    pressKey('Escape')
    expect(stage()).toBeNull()
  })

  it('fills the space around the expanded view with the given background', () => {
    render({ expandedView: story, expandedBackground: 'rgb(1, 2, 3)' })
    openFullscreen()
    expect(layer().style.background).toBe('rgb(1, 2, 3)')
  })

  it('ignores the background without an expanded view', () => {
    render({ expandedBackground: 'rgb(1, 2, 3)' })
    openFullscreen()
    expect(layer().style.background).toBe('')
  })
})
