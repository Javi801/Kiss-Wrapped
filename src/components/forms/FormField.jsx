import { Label } from '@/components/ui/label'

import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

/**
 * Validation message under a form control.
 */
export function FieldError({ children }) {
  const PALETTE = usePalette()
  return <p style={{ ...TEXT.caption, color: PALETTE.danger }}>{children}</p>
}

/**
 * Labeled form field: the control and anything shown under it (`children`), then one row
 * with the field error on the left and, when `maxLength` is passed, the character counter
 * on the right.
 */
export default function FormField({ label, required = false, length, maxLength, error, children }) {
  const PALETTE = usePalette()
  const hasCounter = maxLength !== undefined
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Label>{required ? `${label} *` : label}</Label>
      {children}
      {(error || hasCounter) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          {error && <FieldError>{error}</FieldError>}
          {hasCounter && (
            <p
              style={{
                ...TEXT.caption,
                color: PALETTE.textSoft,
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              {length}/{maxLength}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
