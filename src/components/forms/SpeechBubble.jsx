import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

/**
 * Comic-style speech bubble whose tail points at the element right above it,
 * or right below it with `tailSide="bottom"`.
 */
export default function SpeechBubble({ children, tailSide = 'top' }) {
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
          left: '1.25rem',
          width: '0.625rem',
          height: '0.625rem',
          transform: 'rotate(45deg)',
          [tailAbove ? 'borderTop' : 'borderBottom']: border,
          [tailAbove ? 'borderLeft' : 'borderRight']: border,
          backgroundColor: PALETTE.accentMuted,
        }}
      />
      <p style={{ ...TEXT.caption, margin: 0, color: PALETTE.text }}>{children}</p>
    </div>
  )
}
