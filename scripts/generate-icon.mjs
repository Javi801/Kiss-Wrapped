/**
 * Generates Android launcher PNG icons for all 4 color palettes.
 * Pure Node.js — no external dependencies.
 * Run: npm run gen:icon
 *
 * Outputs to android/app/src/main/res/mipmap-* directories:
 *   ic_launcher_{color}.png         — legacy icon (white background)
 *   ic_launcher_round_{color}.png   — same image (launcher applies round mask)
 *   ic_launcher_foreground_{color}.png — adaptive icon foreground (transparent)
 *
 * Also regenerates the default ic_launcher* files (yellow variant).
 */

import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const RES = resolve(__dir, '../android/app/src/main/res')

// ─── Palettes ────────────────────────────────────────────────────────────────
const PALETTES = {
  yellow: { O: '#FF8101', M: '#FFA102', I: '#FFDC00', H: '#FFFBE3' },
  pink:   { O: '#da4496', M: '#e873a7', I: '#FABAD5', H: '#FEF1FB' },
  blue:   { O: '#4675E1', M: '#6699fe', I: '#97BDFC', H: '#F5F5F3' },
  purple: { O: '#8950FF', M: '#B58DFF', I: '#D3C0F8', H: '#F8F2F3' },
}

// ─── Pixel grids (mirror of SparkleIcon.jsx) ─────────────────────────────────
const _ = null

const MAIN = [
  [_,_,_,_,_,_,_,_,_,_,_,'O',_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,'O',_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,'O','H','O',_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,'O','H','O',_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,'O','H','O',_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,'O','H','H','I','O',_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,'O','H','H','I','O',_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,'O','H','I','I','O',_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,'O','H','H','I','I','I','O',_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,'O','H','H','I','I','I','O',_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,'O','H','H','I','I','I','I','I','O',_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,'O','H','H','I','I','I','I','I','O',_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,'O','H','H','I','I','I','I','I','I','I','O',_,_,_,_,_,_],
  [_,_,_,_,'O','O','H','H','I','I','I','I','I','I','I','I','I','O','O',_,_,_,_],
  [_,_,'O','O','H','H','I','I','I','I','I','I','I','I','I','I','M','M','M','O','O',_,_],
  ['O','O','I','I','I','I','I','I','I','I','I','I','I','I','I','M','M','M','M','M','M','O','O'],
  [_,_,'O','O','I','I','I','I','I','I','I','I','I','I','M','M','M','M','M','O','O',_,_],
  [_,_,_,_,'O','O','I','I','I','I','I','I','I','M','M','M','M','O','O',_,_,_,_],
  [_,_,_,_,_,_,'O','I','I','I','I','I','I','M','M','M','O',_,_,_,_,_,_],
  [_,_,_,_,_,_,_,'O','I','I','I','I','M','M','M','O',_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,'O','I','I','I','M','M','O',_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,'O','I','I','M','M','M','O',_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,'O','I','M','M','O',_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,'O','M','M','M','O',_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,'O','M','M','M','O',_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,'O','M','O',_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,'O','M','O',_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,'O','M','O',_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,'O',_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,'O',_,_,_,_,_,_,_,_,_,_,_],
]

const MEDIUM = [
  [_,_,_,_,'O',_,_,_,_],
  [_,_,_,_,'O',_,_,_,_],
  [_,_,_,'O','I','O',_,_,_],
  [_,_,'O','I','I','I','O',_,_],
  ['O','O','I','I','I','I','I','O','O'],
  [_,_,'O','I','I','I','O',_,_],
  [_,_,_,'O','I','O',_,_,_],
  [_,_,_,_,'O',_,_,_,_],
  [_,_,_,_,'O',_,_,_,_],
]

const SMALL = [
  [_,_,_,'O',_,_,_],
  ['O',_,_,'O',_,_,'O'],
  [_,'O',_,'O',_,'O',_],
  [_,_,_,_,_,_,_],
  ['O','O',_,_,_,'O','O'],
  [_,_,_,_,_,_,_],
  [_,'O',_,'O',_,'O',_],
  ['O',_,_,'O',_,_,'O'],
  [_,_,_,'O',_,_,_],
]

const TINY = [
  [_,'I',_],
  [_,'I',_],
  ['I','H','I'],
  [_,'I',_],
  [_,'I',_],
]

// Placements matching SparkleIcon.jsx viewBox="0 0 80 80"
const LAYERS = [
  { grid: MAIN,   cell: 2, ox: 16, oy: 10 },
  { grid: MEDIUM, cell: 2, ox: 2,  oy: 2  },
  { grid: SMALL,  cell: 2, ox: 60, oy: 60 },
  { grid: TINY,   cell: 4, ox: 63, oy: 2  },
  { grid: TINY,   cell: 4, ox: 10, oy: 55 },
]
const VIEWBOX = 80

// ─── PNG encoder ─────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff]
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type)
  const crcInput = Buffer.concat([typeBuf, data])
  const lenBuf = Buffer.allocUnsafe(4)
  lenBuf.writeUInt32BE(data.length)
  const crcBuf = Buffer.allocUnsafe(4)
  crcBuf.writeUInt32BE(crc32(crcInput))
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePNG(width, height, rgba) {
  const stride = 1 + width * 4
  const raw = Buffer.allocUnsafe(height * stride)
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6  // 8-bit RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// ─── Renderer ────────────────────────────────────────────────────────────────
function hexToRGB(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function renderIcon(P, { canvasSize, bgHex = null, iconOffsetX = 0, iconOffsetY = 0, iconSize = null }) {
  const size = iconSize ?? canvasSize
  const scale = size / VIEWBOX
  const rgba = Buffer.alloc(canvasSize * canvasSize * 4, 0)

  if (bgHex) {
    const [r, g, b] = hexToRGB(bgHex)
    for (let i = 0; i < canvasSize * canvasSize * 4; i += 4) {
      rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = 255
    }
  }

  const colorCache = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, hexToRGB(v)]))

  for (const { grid, cell, ox, oy } of LAYERS) {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const key = grid[row][col]
        if (!key) continue
        const [pr, pg, pb] = colorCache[key]
        const x0 = Math.round(iconOffsetX + (ox + col * cell) * scale)
        const y0 = Math.round(iconOffsetY + (oy + row * cell) * scale)
        const x1 = Math.round(iconOffsetX + (ox + (col + 1) * cell) * scale)
        const y1 = Math.round(iconOffsetY + (oy + (row + 1) * cell) * scale)
        for (let py = Math.max(0, y0); py < Math.min(canvasSize, y1); py++) {
          for (let px = Math.max(0, x0); px < Math.min(canvasSize, x1); px++) {
            const idx = (py * canvasSize + px) * 4
            rgba[idx] = pr; rgba[idx + 1] = pg; rgba[idx + 2] = pb; rgba[idx + 3] = 255
          }
        }
      }
    }
  }

  return rgba
}

// ─── Sizes ───────────────────────────────────────────────────────────────────
// Adaptive foreground: icon occupies the 72dp safe zone inside the 108dp canvas.
const SAFE_RATIO = 72 / 108

const DENSITIES = {
  'mipmap-mdpi':    { legacy: 48,  foreground: 108 },
  'mipmap-hdpi':    { legacy: 72,  foreground: 162 },
  'mipmap-xhdpi':   { legacy: 96,  foreground: 216 },
  'mipmap-xxhdpi':  { legacy: 144, foreground: 324 },
  'mipmap-xxxhdpi': { legacy: 192, foreground: 432 },
}

// ─── Generate ────────────────────────────────────────────────────────────────
for (const [colorName, P] of Object.entries(PALETTES)) {
  for (const [dir, { legacy, foreground }] of Object.entries(DENSITIES)) {
    const outDir = `${RES}/${dir}`

    // Legacy launcher icons (white background)
    const legacyRGBA = renderIcon(P, { canvasSize: legacy, bgHex: '#FFFFFF' })
    const legacyPNG = encodePNG(legacy, legacy, legacyRGBA)
    writeFileSync(`${outDir}/ic_launcher_${colorName}.png`, legacyPNG)
    writeFileSync(`${outDir}/ic_launcher_round_${colorName}.png`, legacyPNG)

    // Adaptive foreground (transparent, icon centered in safe zone)
    const iconSize = Math.round(foreground * SAFE_RATIO)
    const pad = Math.round((foreground - iconSize) / 2)
    const fgRGBA = renderIcon(P, { canvasSize: foreground, bgHex: null, iconOffsetX: pad, iconOffsetY: pad, iconSize })
    writeFileSync(`${outDir}/ic_launcher_foreground_${colorName}.png`, encodePNG(foreground, foreground, fgRGBA))
  }
  process.stdout.write(`  ${colorName}\n`)
}

// Regenerate the default ic_launcher* as yellow (used by the <application> tag)
const yellowP = PALETTES.yellow
for (const [dir, { legacy, foreground }] of Object.entries(DENSITIES)) {
  const outDir = `${RES}/${dir}`
  const legacyRGBA = renderIcon(yellowP, { canvasSize: legacy, bgHex: '#FFFFFF' })
  const legacyPNG = encodePNG(legacy, legacy, legacyRGBA)
  writeFileSync(`${outDir}/ic_launcher.png`, legacyPNG)
  writeFileSync(`${outDir}/ic_launcher_round.png`, legacyPNG)
  const iconSize = Math.round(foreground * SAFE_RATIO)
  const pad = Math.round((foreground - iconSize) / 2)
  const fgRGBA = renderIcon(yellowP, { canvasSize: foreground, bgHex: null, iconOffsetX: pad, iconOffsetY: pad, iconSize })
  writeFileSync(`${outDir}/ic_launcher_foreground.png`, encodePNG(foreground, foreground, fgRGBA))
}

process.stdout.write('Done! Run `npx cap sync` and rebuild.\n')
