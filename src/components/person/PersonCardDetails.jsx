import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import { formatShortDate } from '@/lib/date'

/**
 * Extra info shown when a person card is expanded: partner period, real name,
 * how we met and free-text detail. Renders nothing when none of them is set.
 */
export default function PersonCardDetails({ person, t, language }) {
  const PALETTE = usePalette()

  const hasExtraInfo =
    person.realName ||
    person.howWeMet ||
    person.detail ||
    person.partnerStatus === 'current' ||
    person.partnerStatus === 'past'
  if (!hasExtraInfo) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {person.partnerStatus === 'current' && person.partnerFrom && (
        <p style={{ ...TEXT.body, color: PALETTE.text }}>
          {t.partnerBadge}: {t.partnerSinceWord} {formatShortDate(person.partnerFrom, language)}
        </p>
      )}
      {person.partnerStatus === 'past' && person.partnerTo && (
        <p style={{ ...TEXT.body, color: PALETTE.text }}>
          {t.partnerBadge}:{' '}
          {person.partnerFrom
            ? `${formatShortDate(person.partnerFrom, language)} – ${formatShortDate(person.partnerTo, language)}`
            : `${t.partnerUntilWord} ${formatShortDate(person.partnerTo, language)}`}
        </p>
      )}
      {person.realName && (
        <p style={{ ...TEXT.body, color: PALETTE.text }}>
          {t.realName}: {person.realName}
        </p>
      )}
      {person.howWeMet && (
        <p style={{ ...TEXT.body, color: PALETTE.text }}>
          {t.met}: {person.howWeMet}
        </p>
      )}
      {person.detail && <p style={{ ...TEXT.body, color: PALETTE.textSoft }}>{person.detail}</p>}
    </div>
  )
}
