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
