import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

/**
 * Comic-style speech bubble whose tail points at the field right above it.
 */
export default function SpeechBubble({ children }) {
  const PALETTE = usePalette()
  const border = `1px solid ${PALETTE.inputBorder}`

  return (
    <div
      role="note"
      style={{
        position: 'relative',
        marginTop: '0.375rem',
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
          top: '-0.375rem',
          left: '1.25rem',
          width: '0.625rem',
          height: '0.625rem',
          transform: 'rotate(45deg)',
          borderTop: border,
          borderLeft: border,
          backgroundColor: PALETTE.accentMuted,
        }}
      />
      <p style={{ ...TEXT.caption, margin: 0, color: PALETTE.text }}>{children}</p>
    </div>
  )
}
