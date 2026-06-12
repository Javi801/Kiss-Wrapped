import { useState, useRef } from 'react'
import TileCard from './TileCard'
import { tileColors } from './tileColors'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

const DOT_LIMIT = 7

export default function TopPersonTile({ label, topPeople, t }) {
  const PALETTE = usePalette()
  const colors = tileColors(false, PALETTE)
  const isMultiple = topPeople.length > 1
  const isEmpty = topPeople.length === 0
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollRef = useRef(null)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setActiveIdx(Math.round(el.scrollLeft / el.offsetWidth))
  }

  return (
    <TileCard>
      <>
        <style>{`.top-person-scroll::-webkit-scrollbar { display: none; }`}</style>
        <p
          style={{
            ...TEXT.label,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: colors.label,
          }}
        >
          {label}
        </p>

        {isMultiple && (
          <p
            style={{
              marginTop: '0.125rem',
              fontSize: '0.7rem',
              lineHeight: '1rem',
              color: colors.helper,
            }}
          >
            {topPeople.length} {t.tiedForTop}
          </p>
        )}

        {isEmpty ? (
          <p
            style={{
              marginTop: '0.5rem',
              fontSize: '1.875rem',
              lineHeight: '2.25rem',
              fontWeight: '700',
              letterSpacing: '-0.025em',
              color: colors.value,
            }}
          >
            —
          </p>
        ) : (
          <div
            ref={scrollRef}
            className="top-person-scroll"
            onScroll={handleScroll}
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              marginTop: '0.5rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {topPeople.map((person, idx) => (
              <div
                key={idx}
                style={{
                  minWidth: '100%',
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always',
                  flexShrink: 0,
                }}
              >
                <p
                  style={{
                    fontSize: '1.875rem',
                    lineHeight: '2.25rem',
                    fontWeight: '700',
                    letterSpacing: '-0.025em',
                    color: colors.value,
                  }}
                >
                  {person.value}
                </p>
                <p style={{ marginTop: '0.25rem', ...TEXT.body, color: colors.helper }}>
                  {person.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {isMultiple && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
            {topPeople.length <= DOT_LIMIT ? (
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {topPeople.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '0.3rem',
                      height: '0.3rem',
                      borderRadius: '50%',
                      background: colors.value,
                      opacity: idx === activeIdx ? 1 : 0.3,
                      transition: 'opacity 0.2s',
                    }}
                  />
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.7rem', lineHeight: '1rem', color: colors.helper }}>
                {activeIdx + 1} / {topPeople.length}
              </p>
            )}
          </div>
        )}
      </>
    </TileCard>
  )
}
