import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {!compact && <Label>{t.partnerLabel}</Label>}
      <div
        style={{
          display: 'flex',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          border: `1px solid ${PALETTE.inputBorder}`,
          width: 'fit-content',
          backgroundColor: PALETTE.inputBg,
        }}
      >
        {PARTNER_STATUSES.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={status === item}
            onClick={() => onChange('partnerStatus', item)}
            style={{
              padding: '0.25rem 1rem',
              ...TEXT.caption,
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: status === item ? PALETTE.accent : 'transparent',
              color: status === item ? PALETTE.textOnAccent : PALETTE.text,
              transition: 'background-color 0.15s, color 0.15s',
            }}
          >
            {item === 'never'
              ? t.partnerNever
              : item === 'current'
                ? t.partnerCurrent
                : t.partnerPast}
          </button>
        ))}
      </div>
      {errors.status && <p style={{ ...TEXT.caption, color: PALETTE.danger }}>{errors.status}</p>}

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Label>{status === 'current' ? t.partnerSince : t.partnerFromLabel}</Label>
              <DatePicker
                value={partnerFrom}
                onChange={(val) => onChange('partnerFrom', val)}
                placeholder={t.partnerDatePlaceholder}
                className="rounded-2xl"
                style={{ ...inputStyle }}
              />
              {errors.partnerFrom && (
                <p style={{ ...TEXT.caption, color: PALETTE.danger }}>{errors.partnerFrom}</p>
              )}
            </div>

            {status === 'past' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Label>{t.partnerToLabel} *</Label>
                <DatePicker
                  value={partnerTo}
                  onChange={(val) => onChange('partnerTo', val)}
                  placeholder={t.partnerDatePlaceholder}
                  className="rounded-2xl"
                  style={{ ...inputStyle }}
                />
                {errors.partnerTo && (
                  <p style={{ ...TEXT.caption, color: PALETTE.danger }}>{errors.partnerTo}</p>
                )}
              </div>
            )}
          </div>
          {!compact && <p style={{ ...TEXT.caption, color: PALETTE.textSoft }}>{t.partnerHint}</p>}
        </>
      )}
    </div>
  )
}
