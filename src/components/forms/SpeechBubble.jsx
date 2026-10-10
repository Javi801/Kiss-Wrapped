import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

/**
 * Comic-style speech bubble, solid and outlined in the accent color so it stands
 * out from any background. Its tail points at the element right above it,
 * or right below it with `tailSide="bottom"`. `tailOffset` moves the tail along
 * the edge (`{ left }` or `{ right }`) and `title` adds a heading. `raised` lifts
 * it above the backdrop of the onboarding tour.
 */
export default function SpeechBubble({
  children,
  title,
  tailSide = 'top',
  tailOffset = { left: '1.25rem' },
  raised = false,
}) {
  const PALETTE = usePalette()
  const border = `2px solid ${PALETTE.accent}`
  const tailAbove = tailSide === 'top'

  return (
    <div
      role="note"
      style={{
        position: 'relative',
        zIndex: raised ? 2 : undefined,
        [tailAbove ? 'marginTop' : 'marginBottom']: '0.375rem',
        padding: '0.625rem 0.75rem',
        borderRadius: '0.875rem',
        border,
        backgroundColor: PALETTE.card,
        boxShadow: '0 6px 18px rgba(0,0,0,0.16)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          [tailAbove ? 'top' : 'bottom']: '-0.4375rem',
          ...tailOffset,
          width: '0.625rem',
          height: '0.625rem',
          transform: 'rotate(45deg)',
          [tailAbove ? 'borderTop' : 'borderBottom']: border,
          [tailAbove ? 'borderLeft' : 'borderRight']: border,
          backgroundColor: PALETTE.card,
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
