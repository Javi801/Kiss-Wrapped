import { usePalette } from '@/lib/theme'
import HeroVisualPlaceholder from '@/components/visuals/HeroVisualPlaceholder'
import InteractiveBubbles from '@/components/visuals/InteractiveBubbles'
import IntroEntryGuide from '@/components/app/IntroEntryGuide'

/**
 * Initial splash-like screen with hidden entry.
 * Acts as a playful gate before entering the main app.
 * `showEntryGuide` points out the hidden entry while onboarding is pending.
 */
export default function IntroScreen({ onOpenMain, showEntryGuide = false, t }) {
  const PALETTE = usePalette()
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 10,
        background: `linear-gradient(135deg, ${PALETTE.accentMuted}, ${PALETTE.gradientMid}, ${PALETTE.gradientEnd})`,
      }}
    >
      {/* Interactive poppable bubbles */}
      <InteractiveBubbles />

      {/* Top radial overlay */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'radial-gradient(circle at top, rgba(255,255,255,0.95), transparent 45%)',
        }}
      />

      {/* Hidden entry in the top-left heart. */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
        <button
          type="button"
          onClick={onOpenMain}
          aria-label={t.hiddenAccess}
          style={{
            position: 'relative',
            display: 'block',
            padding: '0.25rem',
            color: PALETTE.accentSoft,
            opacity: 0.4,
            transition: 'opacity 150ms',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ♡
        </button>
        {showEntryGuide ? <IntroEntryGuide t={t} /> : null}
      </div>

      {/* Center visual */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <HeroVisualPlaceholder t={t} />
      </div>

      {/* Dims the bubbles and the visual so the entry guide stands out. Sits below the heart. */}
      {showEntryGuide ? (
        <div
          data-entry-backdrop=""
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            backgroundColor: 'rgba(24,14,34,0.6)',
          }}
        />
      ) : null}
    </div>
  )
}
