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
 * Labeled form field: the control and anything shown under it (`children`), then the
 * character counter when `maxLength` is passed, then the field error.
 */
export default function FormField({ label, required = false, length, maxLength, error, children }) {
  const PALETTE = usePalette()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Label>{required ? `${label} *` : label}</Label>
      {children}
      {maxLength !== undefined && (
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: 'right' }}>
          {length}/{maxLength}
        </p>
      )}
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
