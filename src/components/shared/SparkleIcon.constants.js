// Icon variants, shared with scripts/generate-icon.mjs.
// Keep this file importable by plain Node: no JSX and no `@/` imports.

// Icon designs, in the order the picker shows them.
export const ICON_SHAPES = ['notebook', 'chart', 'orbit']

// Per icon color: the two swatch tones (glyph over background).
export const ICON_TONES = {
  pink: { glyph: '#E27396', background: '#FFDDEA' },
  lavender: { glyph: '#6A52C7', background: '#E2CAE8' },
  green: { glyph: '#5A9E72', background: '#D4EDDA' },
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Variant key for a design and a color, e.g. notebookPink.
export const iconVariantKey = (shape, color) => `${shape}${capitalize(color)}`

// Per variant: its design and color, the Android resource suffix (resource names only
// allow a-z, 0-9 and _), and the in-app image in src/assets/icons/.
export const ICON_VARIANTS = Object.fromEntries(
  ICON_SHAPES.flatMap((shape) =>
    Object.keys(ICON_TONES).map((color) => [
      iconVariantKey(shape, color),
      {
        shape,
        color,
        resource: `${shape}_${color}`,
        image: `${shape}_${color}.webp`,
      },
    ])
  )
)

// Variant whose image backs the default ic_launcher* resources and the unknown-variant fallback.
// Must match DEFAULT_SETTINGS.iconColor and the alias enabled in AndroidManifest.xml.
export const DEFAULT_ICON_VARIANT = 'notebookPink'
