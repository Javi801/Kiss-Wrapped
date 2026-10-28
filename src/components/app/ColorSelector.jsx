import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { TEXT, PALETTES } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import {
  ICON_SHAPES,
  ICON_TONES,
  ICON_VARIANTS,
  DEFAULT_ICON_VARIANT,
  iconVariantKey,
} from '@/components/shared/SparkleIcon.constants'
import { SparkleIcon } from '@/components/shared/SparkleIcon'

const THEMES = Object.keys(PALETTES).map((key) => ({
  key,
  gradient: `linear-gradient(135deg, ${PALETTES[key].bgGradientFrom}, ${PALETTES[key].bgGradientVia}, ${PALETTES[key].bgGradientTo})`,
}))

// Two-tone swatch: the glyph color in the center over the icon background.
const iconSwatch = ({ glyph, background }) =>
  `radial-gradient(circle, ${glyph} 0 40%, ${background} 46%)`

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export default function ColorSelector({
  iconColor,
  setIconColor,
  theme,
  setTheme,
  t,
  accent = true,
}) {
  const PALETTE = usePalette()
  const triggerStyle = {
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.controlBg,
  }
  const colorLabel = (c) => t[`color${capitalize(c)}`] ?? c
  // The picker edits the design and the color of one icon variant independently.
  const { shape: iconShape, color: iconTone } =
    ICON_VARIANTS[iconColor] ?? ICON_VARIANTS[DEFAULT_ICON_VARIANT]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {theme !== undefined && setTheme && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p
            style={{
              ...TEXT.body,
              textTransform: 'uppercase',
              color: accent ? 'rgba(255,255,255,0.88)' : PALETTE.textSoft,
            }}
          >
            {t.appTheme}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {THEMES.map(({ key, gradient }) => {
              const selected = theme === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  className="rounded-2xl"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem',
                    border: selected
                      ? `2px solid ${PALETTE.accent}`
                      : `1.5px solid ${PALETTE.inputBorder}`,
                    backgroundColor: selected ? PALETTE.accentMuted : PALETTE.controlBg,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  <span
                    className="rounded-full"
                    style={{
                      display: 'block',
                      width: '2rem',
                      height: '2rem',
                      background: gradient,
                      boxShadow: selected
                        ? '0 2px 8px rgba(0,0,0,0.18)'
                        : '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  />
                  <span
                    style={{
                      ...TEXT.caption,
                      fontWeight: selected ? '700' : '500',
                      color: selected ? PALETTE.accent : PALETTE.textSoft,
                    }}
                  >
                    {t[`theme${capitalize(key)}`]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p
          style={{
            ...TEXT.body,
            textTransform: 'uppercase',
            color: accent ? 'rgba(255,255,255,0.88)' : PALETTE.textSoft,
          }}
        >
          {t.appIcon}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {ICON_SHAPES.map((shape) => {
            const selected = iconShape === shape
            const label = t[`icon${capitalize(shape)}`] ?? shape
            return (
              <button
                key={shape}
                type="button"
                aria-label={label}
                aria-pressed={selected}
                // Re-tapping the current icon must not touch the launcher aliases again.
                onClick={() => !selected && setIconColor(iconVariantKey(shape, iconTone))}
                className="rounded-2xl"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '0.5rem',
                  border: selected
                    ? `2px solid ${PALETTE.accent}`
                    : `1.5px solid ${PALETTE.inputBorder}`,
                  backgroundColor: selected ? PALETTE.accentMuted : PALETTE.controlBg,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <SparkleIcon palette={iconVariantKey(shape, iconTone)} size={48} />
              </button>
            )
          })}
        </div>

        <Select
          modal={false}
          value={iconTone}
          onValueChange={(color) => setIconColor(iconVariantKey(iconShape, color))}
        >
          <SelectTrigger
            aria-label={t.iconColor}
            className="rounded-3xl"
            style={{ height: '3rem', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', ...triggerStyle }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <SelectValue placeholder={t.iconColor} />
            </div>
          </SelectTrigger>

          <SelectContent>
            {Object.keys(ICON_TONES).map((c) => (
              <SelectItem key={c} value={c}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    className="rounded-full"
                    style={{
                      height: '1rem',
                      width: '1rem',
                      flexShrink: 0,
                      background: iconSwatch(ICON_TONES[c]),
                      // Keeps the light backgrounds visible on the light themes.
                      border: '1px solid rgba(128, 128, 128, 0.55)',
                    }}
                  />
                  {colorLabel(c)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
