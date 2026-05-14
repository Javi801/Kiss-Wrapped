// Pixel-art sparkle star group icon — rendered as a grid of colored rects.
// Each palette matches one of the four color variants in the design reference.

export { SPARKLE_PALETTES, PALETTE_SWATCHES } from './SparkleIcon.constants'

const PALETTES = {
  yellow:   { O: '#FF8101', M: '#FFA102', I: '#FFDC00', H: '#FFFBE3' },
  pink:   { O: '#da4496', M: '#e873a7', I: '#FABAD5', H: '#FEF1FB' },
  blue:   { O: '#4675E1', M: '#6699fe', I: '#97BDFC', H: '#F5F5F3' },
  purple: { O: '#8950FF', M: '#B58DFF', I: '#D3C0F8', H: '#F8F2F3' },
}

const _ = null

// 23x27 main sparkle star — cell 7px, origin (0, 9)
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

// 9×9 companion star
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

// 7×9 small star
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

// 3×3 tiny cross-sparkle
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
      {/* MAIN — centrado (cell=2 → 46×60 en viewBox 100×100) */}
      <PixelGrid grid={MAIN} cell={2} ox={16} oy={10} palette={p} />

      {/* MEDIUM — esquina superior izquierda (cell=2 → 18×18) */}
      <PixelGrid grid={MEDIUM} cell={2} ox={2} oy={2} palette={p} />

      {/* SMALL — esquina inferior derecha (cell=2 → 14×18) */}
      <PixelGrid grid={SMALL} cell={2} ox={60} oy={60} palette={p} />

      {/* TINY — esquina superior derecha (cell=4 → 12×12) */}
      <PixelGrid grid={TINY} cell={4} ox={63} oy={2} palette={p} />

      {/* TINY — esquina inferior izquierda (cell=4 → 12×12) */}
      <PixelGrid grid={TINY} cell={4} ox={10} oy={55} palette={p} />
    </svg>
  )
}
