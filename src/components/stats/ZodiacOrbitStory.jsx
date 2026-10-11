import { PALETTES } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import {
  getRadarPoint,
  getRadarRings,
  getRadarScaleMax,
  getRadarValuePoints,
  toSvgPoints,
} from '@/components/stats/radarGeometry'

// Colors, sizes and fonts are fixed here on purpose while the story design is not
// final: they are not palette tokens and do not follow the TEXT scale.
const WIDTH = 1080
const HEIGHT = 1920

const STORY_COLORS = {
  dark: { top: '#211329', bottom: '#39213e', accent: '#d6b2ff', soft: '#ab8eba', warm: '#ffd0b4' },
  pink: { top: '#2b1820', bottom: '#4c2930', accent: '#ffc4ad', soft: '#bd9698', warm: '#ffe0a5' },
  green: { top: '#102829', bottom: '#203e40', accent: '#b6eee0', soft: '#8bb4b1', warm: '#e4e7b8' },
}
const HEADLINE_COLOR = '#fff2ef'
const SIGN_NAME_COLOR = '#eee0ed'

const SERIF = "Georgia, 'Noto Serif', serif"
const SANS = 'Inter, Arial, sans-serif'

const BRAND = 'KISSWRAPPED'

const CENTER = { x: 540, y: 965 }
const RADIUS = 302
const LABEL_RADIUS = 394
const RING_COUNT = 4
const TOP_SIGN_SIZES = [43, 40, 34]

// Deterministic stardust, so the preview and the exported image are identical.
const STARDUST = (() => {
  const dust = []
  let seed = 31
  const next = () => (seed = (seed * 16807) % 2147483647)
  for (let i = 0; i < 190; i++) {
    const x = next() % WIDTH
    const y = next() % HEIGHT
    dust.push({ x, y, width: i % 5 === 0 ? 3 : 2, opacity: i % 3 === 0 ? 0.22 : 0.09 })
  }
  return dust
})()

function Star({ x, y, r, fill }) {
  const d = [
    `M${x},${y - r}`,
    `Q${x + 2},${y - 2} ${x + r},${y}`,
    `Q${x + 2},${y + 2} ${x},${y + r}`,
    `Q${x - 2},${y + 2} ${x - r},${y}`,
    `Q${x - 2},${y - 2} ${x},${y - r}Z`,
  ].join(' ')
  return <path d={d} fill={fill} />
}

/**
 * Story-sized image (1080 × 1920) of the people per zodiac sign.
 * `signs` and `topSigns` come from `getZodiacOrbit`.
 */
export default function ZodiacOrbitStory({ signs = [], topSigns = [], t }) {
  const P = usePalette()
  const theme = Object.keys(PALETTES).find((key) => PALETTES[key] === P)
  const C = STORY_COLORS[theme] ?? STORY_COLORS.pink

  const values = signs.map((sign) => sign.value)
  const scaleMax = getRadarScaleMax(values, RING_COUNT)
  const rings = getRadarRings(signs.length, RING_COUNT, RADIUS, CENTER)
  const valuePoints = getRadarValuePoints(values, scaleMax, RADIUS, CENTER)
  const polygon = toSvgPoints(valuePoints)

  const topSignText = topSigns.map((sign) => `${sign.glyph} ${sign.label}`).join('  ·  ')
  const topSignSize = TOP_SIGN_SIZES[topSigns.length - 1] ?? TOP_SIGN_SIZES[0]
  const ariaLabel = `${t.zodiacOrbitAriaLabel}: ${signs
    .map((sign) => `${sign.label} ${sign.value}`)
    .join(', ')}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={ariaLabel}
      style={{ display: 'block' }}
      textAnchor="middle"
      fontFamily={SANS}
    >
      <defs>
        <linearGradient
          id="zodiac-orbit-bg"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2={WIDTH}
          y2={HEIGHT}
        >
          <stop offset="0" stopColor={C.top} />
          <stop offset="1" stopColor={C.bottom} />
        </linearGradient>
        <radialGradient
          id="zodiac-orbit-glow"
          gradientUnits="userSpaceOnUse"
          cx="540"
          cy="850"
          r="700"
          fx="540"
          fy="800"
        >
          <stop offset="0" stopColor={C.accent} stopOpacity="0.1" />
          <stop offset="1" stopColor={C.accent} stopOpacity="0" />
        </radialGradient>
        <filter id="zodiac-orbit-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
      </defs>

      {/* Background, stardust and frame */}
      <rect width={WIDTH} height={HEIGHT} fill="url(#zodiac-orbit-bg)" />
      <rect width={WIDTH} height={HEIGHT} fill="url(#zodiac-orbit-glow)" />
      {STARDUST.map((dust, i) => (
        <rect
          key={i}
          x={dust.x}
          y={dust.y}
          width={dust.width}
          height="2"
          fill={C.accent}
          fillOpacity={dust.opacity}
        />
      ))}
      <rect
        x="35"
        y="35"
        width="1010"
        height="1850"
        fill="none"
        stroke={C.accent}
        strokeOpacity="0.16"
      />

      {/* Brand and heading */}
      <text x="540" y="122" fontSize="25" letterSpacing="0.45em" fill={C.accent}>
        {BRAND}
      </text>
      <Star x={185} y={112} r={9} fill={C.accent} />
      <Star x={895} y={112} r={9} fill={C.accent} />
      <text x="540" y="235" fontSize="31" fontFamily={SERIF} fill={C.warm}>
        {t.zodiacOrbitKicker}
      </text>
      <text x="540" y="365" fontSize="112" fontFamily={SERIF} fill={HEADLINE_COLOR}>
        {t.zodiacOrbitTitleTop}
      </text>
      <text x="540" y="477" fontSize="112" fontFamily={SERIF} fill={HEADLINE_COLOR}>
        {t.zodiacOrbitTitleBottom}
      </text>
      <text x="540" y="550" fontSize="25" fill={C.soft}>
        {t.zodiacOrbitSubtitle}
      </text>
      <Star x={141} y={368} r={25} fill={C.warm} />
      <Star x={927} y={440} r={19} fill={C.accent} />

      {/* Radar grid */}
      {rings.map((ring, i) => {
        const outer = i === rings.length - 1
        return (
          <polygon
            key={i}
            points={toSvgPoints(ring)}
            fill="none"
            stroke={C.accent}
            strokeOpacity={outer ? 0.33 : 0.15}
            strokeWidth={outer ? 2 : 1}
          />
        )
      })}
      {signs.map((sign, i) => {
        const end = getRadarPoint(i, signs.length, RADIUS, CENTER)
        const label = getRadarPoint(i, signs.length, LABEL_RADIUS, CENTER)
        return (
          <g key={sign.glyph} data-zodiac-sign={sign.glyph}>
            <line
              x1={CENTER.x}
              y1={CENTER.y}
              x2={end.x.toFixed(2)}
              y2={end.y.toFixed(2)}
              stroke={C.accent}
              strokeOpacity="0.14"
            />
            <text
              x={label.x.toFixed(2)}
              y={(label.y - 10).toFixed(2)}
              fontSize="39"
              fill={C.accent}
            >
              {sign.glyph}
            </text>
            <text
              x={label.x.toFixed(2)}
              y={(label.y + 25).toFixed(2)}
              fontSize="24"
              fill={SIGN_NAME_COLOR}
            >
              {sign.label}
            </text>
            <text x={label.x.toFixed(2)} y={(label.y + 57).toFixed(2)} fontSize="22" fill={C.soft}>
              {sign.value}
            </text>
          </g>
        )
      })}
      {rings.map((_, i) => (
        <text
          key={i}
          x={CENTER.x + 13}
          y={CENTER.y - (RADIUS * (i + 1)) / RING_COUNT + 20}
          fontSize="16"
          textAnchor="start"
          fill={C.soft}
        >
          {(scaleMax * (i + 1)) / RING_COUNT}
        </text>
      ))}

      {/* Values: a blurred copy of the outline gives the glow */}
      <polygon
        points={polygon}
        fill="none"
        stroke={C.accent}
        strokeWidth="4"
        filter="url(#zodiac-orbit-blur)"
      />
      <polygon
        points={polygon}
        fill={C.accent}
        fillOpacity="0.2"
        stroke={C.accent}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {valuePoints.map((point, i) => (
        <circle key={i} cx={point.x.toFixed(2)} cy={point.y.toFixed(2)} r="6" fill={C.warm} />
      ))}

      <line x1="125" y1="1457" x2="955" y2="1457" stroke={C.accent} strokeOpacity="0.25" />

      {/* Most repeated signs */}
      <text
        x="540"
        y="1545"
        fontSize={topSignSize}
        fontFamily={SERIF}
        fill={C.warm}
        data-zodiac-top-signs
      >
        {topSignText}
      </text>
      <text x="540" y="1590" fontSize="21" fill={C.soft}>
        {topSigns.length > 1 ? t.zodiacOrbitTopSigns : t.zodiacOrbitTopSign}
      </text>

      {/* Closing lines */}
      <text x="540" y="1703" fontSize="40" fontFamily={SERIF} fill={HEADLINE_COLOR}>
        {t.zodiacOrbitClosingTop}
      </text>
      <text x="540" y="1751" fontSize="34" fontFamily={SERIF} fill={C.soft}>
        {t.zodiacOrbitClosingBottom}
      </text>
    </svg>
  )
}
