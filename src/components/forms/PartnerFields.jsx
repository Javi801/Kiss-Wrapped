import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import ChoiceToggle from '@/components/forms/ChoiceToggle'
import FormField, { FieldError } from '@/components/forms/FormField'

import { TEXT } from '@/lib/constants'
import { PARTNER_STATUSES } from '@/lib/partner'
import { usePalette } from '@/lib/theme'

/**
 * Partner status selector with the date fields of the selected status.
 * `errors` holds translated text per field (status, partnerFrom, partnerTo).
 * The compact variant drops the main label and the hint.
 */
export default function PartnerFields({
  status,
  partnerFrom,
  partnerTo,
  onChange,
  errors = {},
  t,
  compact = false,
}) {
  const PALETTE = usePalette()

  const inputStyle = {
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.inputBg,
  }

  const hasDates = status === 'current' || status === 'past'
  const statusOptions = PARTNER_STATUSES.map((item) => ({
    value: item,
    label:
      item === 'never' ? t.partnerNever : item === 'current' ? t.partnerCurrent : t.partnerPast,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {!compact && <Label>{t.partnerLabel}</Label>}
      <ChoiceToggle
        options={statusOptions}
        value={status}
        onChange={(item) => onChange('partnerStatus', item)}
      />
      {errors.status && <FieldError>{errors.status}</FieldError>}

      {hasDates && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: status === 'past' ? 'repeat(2, minmax(0, 1fr))' : '1fr',
              gap: compact ? '0.5rem' : '1rem',
              marginTop: '0.25rem',
            }}
          >
            <FormField
              label={status === 'current' ? t.partnerSince : t.partnerFromLabel}
              error={errors.partnerFrom}
            >
              <DatePicker
                value={partnerFrom}
                onChange={(val) => onChange('partnerFrom', val)}
                placeholder={t.partnerDatePlaceholder}
                className="rounded-2xl"
                style={{ ...inputStyle }}
              />
            </FormField>

            {status === 'past' && (
              <FormField label={t.partnerToLabel} required error={errors.partnerTo}>
                <DatePicker
                  value={partnerTo}
                  onChange={(val) => onChange('partnerTo', val)}
                  placeholder={t.partnerDatePlaceholder}
                  className="rounded-2xl"
                  style={{ ...inputStyle }}
                />
              </FormField>
            )}
          </div>
          {!compact && <p style={{ ...TEXT.caption, color: PALETTE.textSoft }}>{t.partnerHint}</p>}
        </>
      )}
    </div>
  )
}
