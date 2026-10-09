// Pixel-art sparkle group rendered as colored grid cells.

import { SPARKLE_PALETTES, SPARKLE_LAYERS, SPARKLE_VIEWBOX } from './SparkleIcon.constants'

export { PALETTE_SWATCHES } from './SparkleIcon.constants'

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
          />
        )
      }
    })
  })
  return <>{rects}</>
}

export function SparkleIcon({ palette = 'yellow', size = 200 }) {
  const p = SPARKLE_PALETTES[palette] ?? SPARKLE_PALETTES.purple

  return (
    <svg
      viewBox={`0 0 ${SPARKLE_VIEWBOX} ${SPARKLE_VIEWBOX}`}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {SPARKLE_LAYERS.map(({ grid, cell, ox, oy }, i) => (
        <PixelGrid key={i} grid={grid} cell={cell} ox={ox} oy={oy} palette={p} />
      ))}
    </svg>
  )
}
