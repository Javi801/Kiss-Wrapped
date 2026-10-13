import { describe, it, expect } from 'vitest'
import {
  getRadarPoint,
  getRadarRings,
  getRadarScaleMax,
  getRadarValuePoints,
  toSvgPoints,
} from '@/components/stats/radarGeometry'

const expectPoint = (point, x, y) => {
  expect(point.x).toBeCloseTo(x)
  expect(point.y).toBeCloseTo(y)
}

describe('getRadarPoint', () => {
  it('puts the first axis straight up', () => {
    expectPoint(getRadarPoint(0, 12, 100), 0, -100)
  })

  it('places the following axes clockwise', () => {
    expectPoint(getRadarPoint(3, 12, 100), 100, 0)
    expectPoint(getRadarPoint(6, 12, 100), 0, 100)
    expectPoint(getRadarPoint(9, 12, 100), -100, 0)
  })

  it('spreads the axes evenly for any axis count', () => {
    expectPoint(getRadarPoint(1, 4, 50), 50, 0)
    expectPoint(getRadarPoint(1, 12, 100), 50, -86.6025)
  })

  it('offsets the point by the center', () => {
    expectPoint(getRadarPoint(0, 12, 302, { x: 540, y: 965 }), 540, 663)
  })
})

describe('getRadarRings', () => {
  it('returns one polygon per ring with one point per axis', () => {
    const rings = getRadarRings(12, 4, 300)

    expect(rings).toHaveLength(4)
    expect(rings.every((ring) => ring.length === 12)).toBe(true)
  })

  it('goes from the innermost ring to the full radius', () => {
    const rings = getRadarRings(12, 4, 300, { x: 10, y: 20 })

    expectPoint(rings[0][0], 10, -55)
    expectPoint(rings[1][0], 10, -130)
    expectPoint(rings[3][0], 10, -280)
  })
})

describe('getRadarValuePoints', () => {
  it('scales each value against the maximum', () => {
    const points = getRadarValuePoints([8, 4, 0, 2], 8, 100)

    expectPoint(points[0], 0, -100)
    expectPoint(points[1], 50, 0)
    expectPoint(points[2], 0, 0)
    expectPoint(points[3], -25, 0)
  })

  it('offsets the points by the center', () => {
    expectPoint(getRadarValuePoints([4, 4, 4, 4], 8, 100, { x: 5, y: 5 })[2], 5, 55)
  })

  it('collapses to the center when the maximum is zero', () => {
    const points = getRadarValuePoints([0, 0, 0], 0, 100)

    points.forEach((point) => expectPoint(point, 0, 0))
  })
})

describe('getRadarScaleMax', () => {
  it('rounds the highest value up to a multiple of the ring count', () => {
    expect(getRadarScaleMax([1, 5, 3], 4)).toBe(8)
    expect(getRadarScaleMax([9], 4)).toBe(12)
  })

  it('keeps a highest value that is already a multiple', () => {
    expect(getRadarScaleMax([8, 2], 4)).toBe(8)
  })

  it('never goes below one unit per ring', () => {
    expect(getRadarScaleMax([0, 0], 4)).toBe(4)
    expect(getRadarScaleMax([], 4)).toBe(4)
  })
})

describe('toSvgPoints', () => {
  it('joins the points as an SVG points attribute', () => {
    expect(
      toSvgPoints([
        { x: 0, y: -100 },
        { x: 86.60254, y: 50 },
      ])
    ).toBe('0.00,-100.00 86.60,50.00')
  })
})
