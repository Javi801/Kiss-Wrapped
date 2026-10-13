// Pure geometry for the radars drawn as SVG: the first axis points up and the rest
// follow clockwise. Points are { x, y } in the coordinates of `center`.

const ORIGIN = { x: 0, y: 0 }

// Point of an axis at a distance from the center.
export function getRadarPoint(index, axisCount, radius, center = ORIGIN) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / axisCount
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  }
}

// Polygons of the grid, innermost first; the last one has the full radius.
export function getRadarRings(axisCount, ringCount, radius, center = ORIGIN) {
  return Array.from({ length: ringCount }, (_, ring) =>
    Array.from({ length: axisCount }, (_, index) =>
      getRadarPoint(index, axisCount, (radius * (ring + 1)) / ringCount, center)
    )
  )
}

// Polygon of the values, one point per axis; `max` is the value drawn at the full radius.
export function getRadarValuePoints(values, max, radius, center = ORIGIN) {
  return values.map((value, index) =>
    getRadarPoint(index, values.length, max > 0 ? (radius * value) / max : 0, center)
  )
}

// Top of the scale: the highest value rounded up to a multiple of the ring count,
// so every ring falls on a whole number.
export function getRadarScaleMax(values, ringCount) {
  const highest = Math.max(0, ...values)
  return Math.max(1, Math.ceil(highest / ringCount)) * ringCount
}

// Points as the value of an SVG `points` attribute.
export function toSvgPoints(points) {
  return points.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
}
