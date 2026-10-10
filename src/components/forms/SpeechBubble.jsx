import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

/**
 * Comic-style speech bubble whose tail points at the element right above it,
 * or right below it with `tailSide="bottom"`. `tailOffset` moves the tail along
 * the edge (`{ left }` or `{ right }`) and `title` adds a heading.
 */
export default function SpeechBubble({
  children,
  title,
  tailSide = 'top',
  tailOffset = { left: '1.25rem' },
}) {
  const PALETTE = usePalette()
  const border = `1px solid ${PALETTE.inputBorder}`
  const tailAbove = tailSide === 'top'

  return (
    <div
      role="note"
      style={{
        position: 'relative',
        [tailAbove ? 'marginTop' : 'marginBottom']: '0.375rem',
        padding: '0.625rem 0.75rem',
        borderRadius: '0.875rem',
        border,
        backgroundColor: PALETTE.accentMuted,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          [tailAbove ? 'top' : 'bottom']: '-0.375rem',
          ...tailOffset,
          width: '0.625rem',
          height: '0.625rem',
          transform: 'rotate(45deg)',
          [tailAbove ? 'borderTop' : 'borderBottom']: border,
          [tailAbove ? 'borderLeft' : 'borderRight']: border,
          backgroundColor: PALETTE.accentMuted,
        }}
      />
      {title && (
        <p style={{ ...TEXT.label, margin: '0 0 0.25rem', color: PALETTE.accentEmphasis2 }}>
          {title}
        </p>
      )}
      <p style={{ ...TEXT.caption, margin: 0, color: PALETTE.text }}>{children}</p>
    </div>
  )
}
