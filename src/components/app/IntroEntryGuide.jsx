import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import TapGuide from '@/components/visuals/TapGuide'

/**
 * First-run guide for the hidden entry: the tap guide on the heart, plus a
 * callout explaining it. Must be rendered inside the positioned
 * wrapper of the heart button, which it uses as its anchor.
 * `showCallout={false}` leaves only the tap guide.
 */
export default function IntroEntryGuide({ t, showCallout = true }) {
  const PALETTE = usePalette()

  if (!showCallout) return <TapGuide />

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
          background: PALETTE.calloutBg,
          boxShadow: `0 16px 38px ${PALETTE.calloutShadow}`,
        }}
      >
        <h2
          style={{
            ...TEXT.bodyStrong,
            margin: 0,
            color: PALETTE.accentEmphasis2,
          }}
        >
          {t.entryGuideTitle}
        </h2>
        <p
          style={{
            ...TEXT.caption,
            margin: '5px 0 0',
            color: PALETTE.textSoft,
          }}
        >
          {t.entryGuideBody}
        </p>
      </div>
    </>
  )
}
