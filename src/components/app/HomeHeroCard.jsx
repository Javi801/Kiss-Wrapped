import { Eye, EyeOff, Languages, Settings } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import { getEventPeople } from '@/lib/stats'
import StatTile from '@/components/shared/StatTile'

const frostedButtonStyle = {
  height: '3.5rem',
  width: '3.5rem',
  padding: '0',
  backgroundColor: 'rgba(255,255,255,0.22)',
  border: '1.5px solid rgba(255,255,255,0.45)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
}

const buttonLabelStyle = {
  fontSize: '0.625rem',
  color: 'rgba(255,255,255,0.85)',
  fontWeight: '600',
  letterSpacing: '0.05em',
  textAlign: 'center',
  maxWidth: '5rem',
}

const buttonColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.375rem',
}

/**
 * Hero card of the main screen: the summary metrics and the frosted buttons
 * for language, stats visibility and settings.
 */
export default function HomeHeroCard({
  people,
  t,
  statsVisible,
  setStatsVisible,
  includePartnerEvents,
  onOpenLanguage,
  onOpenSettings,
}) {
  const PALETTE = usePalette()

  // Count all events across every saved person. Partner-period events count only
  // when the user chose to include them in the statistics.
  const totalEvents = getEventPeople(people, includePartnerEvents).reduce(
    (sum, person) => sum + (person.events?.length || 0),
    0
  )

  return (
    <Card
      style={{
        overflow: 'hidden',
        borderRadius: '30px',
        border: 'none',
        color: PALETTE.textOnAccent,
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.accentSoft}, ${PALETTE.gradientEnd})`,
      }}
    >
      <CardContent style={{ position: 'relative', padding: '1.5rem' }}>
        {/* Decorative blurred circles */}
        <div
          className="rounded-full"
          style={{
            position: 'absolute',
            right: '-2rem',
            top: '-2rem',
            height: '7rem',
            width: '7rem',
            backgroundColor: 'rgba(255,255,255,0.1)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="rounded-full"
          style={{
            position: 'absolute',
            left: '-2rem',
            bottom: '0',
            height: '6rem',
            width: '6rem',
            backgroundColor: 'rgba(255,255,255,0.1)',
            filter: 'blur(40px)',
          }}
        />

        <h1
          style={{
            ...TEXT.heading,
            letterSpacing: '-0.025em',
          }}
        >
          {t.heroTitle}
        </h1>

        <div
          style={{
            marginTop: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '0.75rem',
          }}
        >
          <StatTile
            label={t.peopleSaved}
            value={statsVisible ? people.length : '-'}
            accent={true}
          />
          <StatTile label={t.totalEvents} value={statsVisible ? totalEvents : '-'} accent={true} />
        </div>

        {/* App settings shown as frosted icon buttons on the gradient. */}
        <div
          style={{
            marginTop: '1.25rem',
            display: 'flex',
            justifyContent: 'space-around',
          }}
        >
          <div style={buttonColumnStyle}>
            <Button
              type="button"
              aria-label={t.language}
              className="rounded-full"
              style={frostedButtonStyle}
              onClick={onOpenLanguage}
            >
              <Languages
                style={{ height: '1.25rem', width: '1.25rem', color: PALETTE.textOnAccent }}
              />
            </Button>
            <span style={buttonLabelStyle}>{t.language}</span>
          </div>

          <div style={buttonColumnStyle}>
            <Button
              type="button"
              aria-label={statsVisible ? t.hideStats : t.showStats}
              aria-pressed={!statsVisible}
              className="rounded-full"
              style={{
                ...frostedButtonStyle,
                backgroundColor: statsVisible ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)',
                border: statsVisible
                  ? '1.5px solid rgba(255,255,255,0.45)'
                  : '1.5px solid rgba(255,255,255,0.2)',
              }}
              onClick={() => setStatsVisible((visible) => !visible)}
            >
              {statsVisible ? (
                <Eye style={{ height: '1.25rem', width: '1.25rem', color: PALETTE.textOnAccent }} />
              ) : (
                <EyeOff
                  style={{ height: '1.25rem', width: '1.25rem', color: 'rgba(255,255,255,0.55)' }}
                />
              )}
            </Button>
            <span style={buttonLabelStyle}>{t.stats}</span>
          </div>

          <div style={buttonColumnStyle}>
            <Button
              type="button"
              aria-label={t.settings}
              className="rounded-full"
              style={frostedButtonStyle}
              onClick={onOpenSettings}
            >
              <Settings
                style={{ height: '1.25rem', width: '1.25rem', color: PALETTE.textOnAccent }}
              />
            </Button>
            <span style={buttonLabelStyle}>{t.settings}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
