import { Calendar } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import { formatShortDate } from '@/lib/date'
import { hasScore, renderKisses, eventIsMissingRequired } from '@/lib/format'

/**
 * Event history of a person card. Each event is a button that opens it for
 * editing; shows an empty-state message when there are no events.
 */
export default function PersonEventList({ events, onSelectEvent, t, language }) {
  const PALETTE = usePalette()

  if (!events.length) {
    return <p style={{ ...TEXT.body, textAlign: 'center' }}>{t.noEventsYet}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {events.map((event) => (
        <button
          key={event.id}
          className="rounded-2xl"
          style={{
            width: '100%',
            border: eventIsMissingRequired(event)
              ? `1px solid ${PALETTE.warningBorder}`
              : `1px solid ${PALETTE.innerCardBorder}`,
            backgroundColor: eventIsMissingRequired(event)
              ? 'rgba(249,213,138,0.08)'
              : PALETTE.card,
            padding: '0.75rem',
            textAlign: 'left',
          }}
          onClick={() => onSelectEvent(event)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>
              <Calendar
                style={{
                  display: 'inline',
                  marginRight: '0.5rem',
                  height: '1rem',
                  width: '1rem',
                }}
              />
              {formatShortDate(event.date, language)}
            </span>

            {hasScore(event.score) && (
              <Badge
                style={{
                  backgroundColor: PALETTE.accentShadow,
                  color: PALETTE.accent,
                  border: 'none',
                }}
              >
                {renderKisses(event.score, t)}
              </Badge>
            )}
          </div>

          {(event.place || event.situation) && (
            <div
              style={{
                marginTop: '0.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem 0.75rem',
                ...TEXT.caption,
                color: PALETTE.textSoft,
              }}
            >
              {event.place && (
                <span>
                  <strong>{t.eventPlace}:</strong> {event.place}
                </span>
              )}
              {event.situation && (
                <span>
                  <strong>{t.eventSituation}:</strong> {event.situation}
                </span>
              )}
            </div>
          )}

          <p style={{ marginTop: '0.5rem', ...TEXT.body, color: PALETTE.textSoft }}>
            {event.details || t.noDetailsAdded}
          </p>

          {event.observations && (
            <p
              style={{
                marginTop: '0.25rem',
                ...TEXT.caption,
                color: PALETTE.textSoft,
              }}
            >
              {event.observations}
            </p>
          )}
        </button>
      ))}
    </div>
  )
}
