import { usePalette } from '@/lib/theme'
import TapGuide from '@/components/visuals/TapGuide'

/**
 * First-run guide for the hidden entry: the tap guide on the heart, plus a
 * callout explaining it. Must be rendered inside the positioned
 * wrapper of the heart button, which it uses as its anchor.
 */
export default function IntroEntryGuide({ t }) {
  const PALETTE = usePalette()

  return (
    <>
      <TapGuide />

      {/* Callout below the heart */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 'calc(100% + 0.75rem)',
          left: '0.25rem',
          zIndex: 1,
          width: 238,
          maxWidth: 'calc(100vw - 2.5rem)',
          borderRadius: 18,
          border: `1px solid ${PALETTE.line}`,
          padding: '12px 13px',
          textAlign: 'left',
          background: PALETTE.isDark ? PALETTE.card : 'rgba(255,255,255,0.92)',
          boxShadow: '0 16px 38px rgba(55,36,61,0.16)',
        }}
      >
        <h2
          style={{
            margin: 0,
            color: PALETTE.accentEmphasis2,
            fontSize: '0.92rem',
            lineHeight: '1.18rem',
            fontWeight: 700,
          }}
        >
          {t.entryGuideTitle}
        </h2>
        <p
          style={{
            margin: '5px 0 0',
            color: PALETTE.textSoft,
            fontSize: '0.76rem',
            lineHeight: '1.1rem',
          }}
        >
          {t.entryGuideBody}
        </p>
      </div>
    </>
  )
}
