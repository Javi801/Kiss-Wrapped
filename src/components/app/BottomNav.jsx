import { BarChart3, Search, UserPlus, Users } from 'lucide-react'

import { TEXT, SCREENS, CONTENT_MAX_WIDTH } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import { tourTargetProps } from '@/lib/onboarding'
import TapGuide from '@/components/visuals/TapGuide'

/**
 * Bottom navigation bar of the main screens.
 *
 * Props:
 *  - screen       Active screen key
 *  - onNavigate   Called with the key of the tapped item
 *  - tourTarget   Key of the item the onboarding tour points at, the only one it
 *                 leaves reachable (`data-tour-target`)
 */
export default function BottomNav({ screen, onNavigate, tourTarget, t }) {
  const PALETTE = usePalette()

  const navItems = [
    { key: SCREENS.main, label: t.home, icon: Users },
    { key: SCREENS.add, label: t.add, icon: UserPlus },
    { key: SCREENS.people, label: t.people, icon: Search },
    { key: SCREENS.stats, label: t.stats, icon: BarChart3 },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backdropFilter: 'blur(8px)',
        borderTop: `1px solid ${PALETTE.inputBorder}`,
        backgroundColor: PALETTE.navBarBg,
      }}
    >
      <div
        style={{
          margin: '0 auto',
          display: 'grid',
          maxWidth: CONTENT_MAX_WIDTH,
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '0.25rem',
          paddingLeft: '0.75rem',
          paddingRight: '0.75rem',
          paddingTop: '0.75rem',
          paddingBottom: '0.75rem',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const active = screen === item.key
          const guided = tourTarget === item.key

          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="rounded-2xl"
              {...tourTargetProps(guided, {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                paddingLeft: '0.5rem',
                paddingRight: '0.5rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                ...TEXT.caption,
                fontWeight: '500',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                background: active
                  ? `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`
                  : 'transparent',
                color: active ? PALETTE.textOnAccent : PALETTE.textSoft,
              })}
            >
              {guided && <TapGuide />}
              <Icon style={{ height: '1rem', width: '1rem' }} />
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
