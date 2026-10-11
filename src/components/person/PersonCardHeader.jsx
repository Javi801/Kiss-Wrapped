import { ChevronDown, ChevronUp, Heart } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

import { TEXT, abbreviateZodiacMonths } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import { effectiveDisplayAge } from '@/lib/date'
import { translateActivity, translateGender } from '@/lib/format'
import TapGuide from '@/components/visuals/TapGuide'

/**
 * Always-visible header of a person card: name, badges, basic info and the
 * expand/collapse toggle. For the onboarding tour, `showTapGuide` puts the tap
 * guide on it and leaves it reachable (`data-tour-target`).
 */
export default function PersonCardHeader({
  person,
  expanded,
  onToggle,
  hasIncompleteEvent,
  showTapGuide,
  t,
}) {
  const PALETTE = usePalette()

  return (
    <button
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '1.25rem',
        textAlign: 'left',
        ...(showTapGuide ? { position: 'relative', pointerEvents: 'auto' } : null),
      }}
      data-tour-target={showTapGuide ? '' : undefined}
      onClick={onToggle}
    >
      {showTapGuide && <TapGuide />}
      <div style={{ minWidth: 0, flex: '1 1 0%' }}>
        {/* Name + badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
          <h3
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ...TEXT.title,
              color: PALETTE.text,
            }}
          >
            {person.name}
          </h3>

          {(person.partnerStatus === 'current' || person.partnerStatus === 'past') && (
            <Badge
              className="rounded-full"
              style={{
                border: 'none',
                backgroundColor: PALETTE.accentMuted,
                color: person.partnerStatus === 'current' ? PALETTE.accent : PALETTE.textSoft,
              }}
            >
              <Heart style={{ marginRight: '0.25rem', height: '0.75rem', width: '0.75rem' }} />
              {person.partnerStatus === 'current' ? t.partnerBadge : t.exPartnerBadge}
            </Badge>
          )}

          {hasIncompleteEvent && (
            <Badge
              className="rounded-full"
              style={{
                border: 'none',
                backgroundColor: PALETTE.warningBadgeBg,
                color: PALETTE.warningBadgeText,
              }}
            >
              {t.missingEventDetailsBadge}
            </Badge>
          )}
        </div>

        {/* Basic info */}
        <div
          style={{
            marginTop: '0.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            ...TEXT.caption,
            color: PALETTE.textSoft,
          }}
        >
          <span>
            {effectiveDisplayAge(person)} {t.years}
          </span>
          <span>•</span>
          <span>{translateGender(person.gender, t)}</span>
          <span>•</span>
          <span>{translateActivity(person.activity, t)}</span>
          <span>•</span>
          <span>{abbreviateZodiacMonths(person.zodiacSign)}</span>
        </div>
      </div>

      {/* Toggle icon */}
      <div
        className="rounded-2xl"
        style={{ padding: '0.5rem', backgroundColor: PALETTE.accentMuted }}
      >
        {expanded ? (
          <ChevronUp style={{ height: '1.25rem', width: '1.25rem', color: PALETTE.accent }} />
        ) : (
          <ChevronDown style={{ height: '1.25rem', width: '1.25rem', color: PALETTE.accent }} />
        )}
      </div>
    </button>
  )
}
