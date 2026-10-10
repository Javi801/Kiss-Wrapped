import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import { formatDisplayDate } from '@/lib/date'

import PersonCard from '@/components/person/PersonCard'

// Grouped people list: a sticky header per group followed by its person cards.
// `cardProps` are forwarded untouched to every PersonCard.
export default function PeopleGroupList({ grouped, groupBy, t, cardProps }) {
  const PALETTE = usePalette()

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {grouped.map(([group, members]) => (
        <div key={group}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}
          >
            {/* Group header */}
            <div
              id={`group-${group}`}
              className="rounded-2xl"
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                paddingLeft: '0.75rem',
                paddingRight: '0.75rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                backdropFilter: 'blur(8px)',
                backgroundColor: PALETTE.surfaceBg,
              }}
            >
              <p
                style={{
                  ...TEXT.label,
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  color: PALETTE.accent,
                }}
              >
                {groupBy === 'lastEventDate' && group !== t.noEvents
                  ? formatDisplayDate(group)
                  : group}
              </p>
            </div>

            {/* Group members */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {members.map((person) => (
                <PersonCard key={person.id} person={person} t={t} {...cardProps} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
