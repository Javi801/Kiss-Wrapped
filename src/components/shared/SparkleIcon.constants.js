// Icon variants, shared with scripts/generate-icon.mjs.
// Keep this file importable by plain Node: no JSX and no `@/` imports.

// Per icon color: the two swatch tones (heart over background), the Android resource
// suffix (resource names only allow a-z, 0-9 and _), and the in-app image in src/assets/icons/.
export const ICON_VARIANTS = {
  lightPurple: {
    heart: '#BC85F3',
    background: '#6159B8',
    resource: 'light_purple',
    image: 'light_purple.webp',
  },
  golden: { heart: '#C38F32', background: '#170F0A', resource: 'golden', image: 'golden.webp' },
  darkPurple: {
    heart: '#A243E9',
    background: '#10022D',
    resource: 'dark_purple',
    image: 'dark_purple.webp',
  },
  darkPink: {
    heart: '#E9555F',
    background: '#180717',
    resource: 'dark_pink',
    image: 'dark_pink.webp',
  },
  darkGreen: {
    heart: '#49CA83',
    background: '#0A1C1B',
    resource: 'dark_green',
    image: 'dark_green.webp',
  },
  lightGreen: {
    heart: '#72D59D',
    background: '#257666',
    resource: 'light_green',
    image: 'light_green.webp',
  },
  lightPink: {
    heart: '#F1B59B',
    background: '#9F8292',
    resource: 'light_pink',
    image: 'light_pink.webp',
  },
}

// Color whose image backs the default ic_launcher* resources and the unknown-color fallback.
// Must match DEFAULT_SETTINGS.iconColor and the alias enabled in AndroidManifest.xml.
export const DEFAULT_ICON_VARIANT = 'lightPink'
