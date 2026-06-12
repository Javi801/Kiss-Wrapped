// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFilesystem = vi.hoisted(() => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  getUri: vi.fn().mockResolvedValue({ uri: 'file:///mock/export.pdf' }),
}))
const mockShare = vi.hoisted(() => ({ share: vi.fn().mockResolvedValue(undefined) }))
const mockDoc = vi.hoisted(() => ({
  setFillColor: vi.fn(),
  setDrawColor: vi.fn(),
  setTextColor: vi.fn(),
  setLineWidth: vi.fn(),
  setLineDash: vi.fn(),
  setFont: vi.fn(),
  setFontSize: vi.fn(),
  text: vi.fn(),
  line: vi.fn(),
  rect: vi.fn(),
  roundedRect: vi.fn(),
  circle: vi.fn(),
  addPage: vi.fn(),
  splitTextToSize: vi.fn().mockReturnValue(['text']),
  getNumberOfPages: vi.fn().mockReturnValue(1),
  setPage: vi.fn(),
  output: vi.fn().mockReturnValue('data:application/pdf;base64,MOCKBASE64'),
  internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
}))

// Use a named function (not arrow) so it can be called with `new`.
// vi.clearAllMocks() only resets call history, not implementations, so
// the function body persists across tests.
const mockJsPDF = vi.hoisted(() =>
  vi.fn(function () {
    return mockDoc
  })
)

vi.mock('jspdf', () => ({ default: mockJsPDF }))

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: mockFilesystem,
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
}))

vi.mock('@capacitor/share', () => ({ Share: mockShare }))

import { exportStatsPdf, saveErrorLog } from '@/lib/pdf-export'
import { COPY } from '@/lib/constants'

const t = COPY.en

const peopleTwoYears = [
  {
    id: '1',
    name: 'Alice',
    birthYear: 1990,
    zodiacSign: 'Aries',
    gender: 'female',
    activity: 'active',
    howWeMet: 'app',
    events: [
      { id: 'e1', date: '2024.01.15', place: 'Home', situation: 'casual', score: 4 },
      { id: 'e2', date: '2024.03.20', place: 'Park', situation: 'date', score: 5 },
      { id: 'e3', date: '2023.06.10', place: 'Home', situation: 'casual', score: 3 },
    ],
  },
  {
    id: '2',
    name: 'Bob',
    birthYear: 1985,
    zodiacSign: 'Taurus',
    gender: 'nonbinary',
    activity: 'occasional',
    howWeMet: 'friends',
    events: [
      { id: 'e4', date: '2024.02.10', place: 'Bar', situation: 'night out', score: 3 },
      { id: 'e5', date: '2023.11.05', place: 'Home', situation: 'casual', score: null },
    ],
  },
]

function resetDocMocks() {
  Object.values(mockDoc).forEach((v) => {
    if (typeof v?.mockReset === 'function') v.mockReset()
  })
  mockDoc.output.mockReturnValue('data:application/pdf;base64,MOCKBASE64')
  mockDoc.splitTextToSize.mockReturnValue(['text'])
  mockDoc.getNumberOfPages.mockReturnValue(1)
}

describe('exportStatsPdf', () => {
  beforeEach(() => {
    resetDocMocks()
    mockFilesystem.writeFile.mockResolvedValue(undefined)
    mockFilesystem.deleteFile.mockResolvedValue(undefined)
    mockFilesystem.getUri.mockResolvedValue({ uri: 'file:///mock/export.pdf' })
    mockShare.share.mockResolvedValue(undefined)
    vi.clearAllMocks()
    mockDoc.output.mockReturnValue('data:application/pdf;base64,MOCKBASE64')
    mockDoc.splitTextToSize.mockReturnValue(['text'])
    mockDoc.getNumberOfPages.mockReturnValue(1)
    mockFilesystem.writeFile.mockResolvedValue(undefined)
    mockFilesystem.deleteFile.mockResolvedValue(undefined)
    mockFilesystem.getUri.mockResolvedValue({ uri: 'file:///mock/export.pdf' })
    mockShare.share.mockResolvedValue(undefined)
  })

  it('writes a PDF to Directory.Cache', async () => {
    await exportStatsPdf([], t)
    expect(mockFilesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ directory: 'CACHE' })
    )
  })

  it('writes the base64 portion of the PDF data URI', async () => {
    await exportStatsPdf([], t)
    const call = mockFilesystem.writeFile.mock.calls[0][0]
    expect(call.data).toBe('MOCKBASE64')
  })

  it('uses a date-based file name ending in .pdf', async () => {
    await exportStatsPdf([], t)
    const call = mockFilesystem.writeFile.mock.calls[0][0]
    expect(call.path).toMatch(/^kisswrapped-\d{4}-\d{2}-\d{2}\.pdf$/)
  })

  it('creates a landscape slide deck', async () => {
    await exportStatsPdf([], t)
    expect(mockJsPDF).toHaveBeenCalledWith(expect.objectContaining({ orientation: 'landscape' }))
    expect(mockDoc.addPage).toHaveBeenCalled()
  })

  it('opens the Share sheet with the file URI', async () => {
    await exportStatsPdf([], t)
    expect(mockShare.share).toHaveBeenCalledWith(
      expect.objectContaining({ files: ['file:///mock/export.pdf'] })
    )
  })

  it('deletes the cache file after sharing', async () => {
    await exportStatsPdf([], t)
    expect(mockFilesystem.deleteFile).toHaveBeenCalledWith(
      expect.objectContaining({ directory: 'CACHE' })
    )
  })
})

describe('saveErrorLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFilesystem.writeFile.mockResolvedValue(undefined)
    mockFilesystem.deleteFile.mockResolvedValue(undefined)
    mockFilesystem.getUri.mockResolvedValue({ uri: 'file:///mock/error.txt' })
    mockShare.share.mockResolvedValue(undefined)
  })

  it('writes a text file to Directory.Cache', async () => {
    await saveErrorLog(new Error('boom'))
    expect(mockFilesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ directory: 'CACHE', encoding: 'utf8' })
    )
  })

  it('includes the error message in the file content', async () => {
    await saveErrorLog(new Error('test failure'))
    const content = mockFilesystem.writeFile.mock.calls[0][0].data
    expect(content).toContain('test failure')
  })

  it('handles a non-Error object by stringifying it', async () => {
    await saveErrorLog('plain string error')
    const content = mockFilesystem.writeFile.mock.calls[0][0].data
    expect(content).toContain('plain string error')
  })

  it('uses a date-based file name ending in .txt', async () => {
    await saveErrorLog(new Error('x'))
    const path = mockFilesystem.writeFile.mock.calls[0][0].path
    expect(path).toMatch(/^kiss-recorder-error-\d{4}-\d{2}-\d{2}\.txt$/)
  })

  it('opens the Share sheet with the file URI', async () => {
    await saveErrorLog(new Error('x'))
    expect(mockShare.share).toHaveBeenCalledWith(
      expect.objectContaining({ files: ['file:///mock/error.txt'] })
    )
  })

  it('deletes the cache file after sharing', async () => {
    await saveErrorLog(new Error('x'))
    expect(mockFilesystem.deleteFile).toHaveBeenCalledWith(
      expect.objectContaining({ directory: 'CACHE' })
    )
  })
})

describe('exportStatsPdf — slide rendering with data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDoc.output.mockReturnValue('data:application/pdf;base64,MOCKBASE64')
    mockDoc.splitTextToSize.mockReturnValue(['text'])
    mockDoc.getNumberOfPages.mockReturnValue(1)
    mockFilesystem.writeFile.mockResolvedValue(undefined)
    mockFilesystem.deleteFile.mockResolvedValue(undefined)
    mockFilesystem.getUri.mockResolvedValue({ uri: 'file:///mock/export.pdf' })
    mockShare.share.mockResolvedValue(undefined)
  })

  it('renders rank list rows when people have events', async () => {
    await exportStatsPdf(peopleTwoYears, t)
    const textArgs = mockDoc.text.mock.calls.map((c) => c[0])
    expect(textArgs).toContain('1')
  })

  it('renders column chart grid lines for monthly data', async () => {
    await exportStatsPdf(peopleTwoYears, t)
    expect(mockDoc.line).toHaveBeenCalled()
  })

  it('renders bubble circles for gender items', async () => {
    await exportStatsPdf(peopleTwoYears, t)
    const circleCalls = mockDoc.circle.mock.calls.length
    expect(circleCalls).toBeGreaterThan(2)
  })

  it('uses CHART_COLORS fallback for score labels in bubble legend', async () => {
    await exportStatsPdf(peopleTwoYears, t)
    const textArgs = mockDoc.text.mock.calls.map((c) => c[0])
    expect(textArgs.some((a) => typeof a === 'string' && a.includes('Ratings'))).toBe(true)
  })

  it('renders multi-year people rank list in slide 3', async () => {
    await exportStatsPdf(peopleTwoYears, t)
    const textArgs = mockDoc.text.mock.calls.map((c) => c[0])
    expect(textArgs.some((a) => typeof a === 'string' && a.includes('Alice'))).toBe(true)
  })

  it('uses Spanish slide copy when langCode is es', async () => {
    await exportStatsPdf([], COPY.es)
    expect(mockFilesystem.writeFile).toHaveBeenCalled()
  })

  it('skips subtitle line in drawTitle when subtitle is empty', async () => {
    await exportStatsPdf([], { ...t, topTracked: '' })
    expect(mockFilesystem.writeFile).toHaveBeenCalled()
  })
})
