// Pixel-art sparkle group rendered as colored grid cells.

export { SPARKLE_PALETTES, PALETTE_SWATCHES } from './SparkleIcon.constants'

const PALETTES = {
  yellow:   { O: '#FF8101', M: '#FFA102', I: '#FFDC00', H: '#FFFBE3' },
  pink:   { O: '#da4496', M: '#e873a7', I: '#FABAD5', H: '#FEF1FB' },
  blue:   { O: '#4675E1', M: '#6699fe', I: '#97BDFC', H: '#F5F5F3' },
  purple: { O: '#8950FF', M: '#B58DFF', I: '#D3C0F8', H: '#F8F2F3' },
}

const _ = null

// Main sparkle grid with 23 columns and 30 rows.
const MAIN = [
  [_,_,_,_,_,_,_,_,_,_,_,'O',_,_,_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,_,_,'O',_,_,_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,_,'O','H','O',_,_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,_,'O','H','O',_,_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,_,'O','H','O',_,_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,'O','H','H','I','O',_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,'O','H','H','I','O',_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,'O','H','I','I','O',_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,'O','H','H','I','I','I','O',_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,'O','H','H','I','I','I','O',_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,'O','H','H','I','I','I','I','I','O',_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,'O','H','H','I','I','I','I','I','O',_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,'O','H','H','I','I','I','I','I','I','I','O',_,_,_,_,_,_,],
  [_,_,_,_,'O','O','H','H','I','I','I','I','I','I','I','I','I','O','O',_,_,_,_,],
  [_,_,'O','O','H','H','I','I','I','I','I','I','I','I','I','I','M','M','M','O','O',_,_,],
  ['O','O','I','I','I','I','I','I','I','I','I','I','I','I','I','M','M','M','M','M','M','O','O',],
  [_,_,'O','O','I','I','I','I','I','I','I','I','I','I','M','M','M','M','M','O','O',_,_,],
  [_,_,_,_,'O','O','I','I','I','I','I','I','I','M','M','M','M','O','O',_,_,_,_,],
  [_,_,_,_,_,_,'O','I','I','I','I','I','I','M','M','M','O',_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,'O','I','I','I','I','M','M','M','O',_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,'O','I','I','I','M','M','O',_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,'O','I','I','M','M','M','O',_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,'O','I','M','M','O',_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,'O','M','M','M','O',_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,'O','M','M','M','O',_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,_,'O','M','O',_,_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,_,'O','M','O',_,_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,_,'O','M','O',_,_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,_,_,'O',_,_,_,_,_,_,_,_,_,_,_,],
  [_,_,_,_,_,_,_,_,_,_,_,'O',_,_,_,_,_,_,_,_,_,_,_,],
]

// 9x9 companion sparkle grid.
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

// 7x9 small sparkle grid.
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

// 3x3 tiny cross-sparkle grid.
const TINY = [
  [_,'I',_],
  [_,'I',_],
  ['I','H','I'],
  [_,'I',_],
  [_,'I',_],
]

function PixelGrid({ grid, cell, ox, oy, palette }) {
  const rects = []
  grid.forEach((row, r) => {
    row.forEach((key, c) => {
      if (key) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={ox + c * cell}
            y={oy + r * cell}
            width={cell}
            height={cell}
            fill={palette[key]}
          />,
        )
      }
    })
  })
  return <>{rects}</>
}

export function SparkleIcon({ palette = 'yellow', size = 200 }) {
  const p = PALETTES[palette] ?? PALETTES.purple

  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Main sparkle centered in the viewBox. */}
      <PixelGrid grid={MAIN} cell={2} ox={16} oy={10} palette={p} />

      {/* Medium sparkle in the top-left corner. */}
      <PixelGrid grid={MEDIUM} cell={2} ox={2} oy={2} palette={p} />

      {/* Small sparkle in the bottom-right corner. */}
      <PixelGrid grid={SMALL} cell={2} ox={60} oy={60} palette={p} />

      {/* Tiny sparkle in the top-right corner. */}
      <PixelGrid grid={TINY} cell={4} ox={63} oy={2} palette={p} />

      {/* Tiny sparkle in the bottom-left corner. */}
      <PixelGrid grid={TINY} cell={4} ox={10} oy={55} palette={p} />
    </svg>
  )
}
