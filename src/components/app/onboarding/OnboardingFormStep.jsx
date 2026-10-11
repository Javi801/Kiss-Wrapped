import { usePalette } from '@/lib/theme'
import { TEXT, CONTENT_MAX_WIDTH } from '@/lib/constants'

/**
 * Layout of an onboarding step that shows a form: a centered title and body over the content,
 * in a column limited to the app's content width.
 *
 * Props:
 *  - title         Step title
 *  - body          Text under the title
 *  - containerRef  Optional ref to the column element
 *  - children      Content under the header
 */
export default function OnboardingFormStep({ title, body, containerRef, children }) {
  const PALETTE = usePalette()

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center' }}>
        <h1 style={{ ...TEXT.heading, margin: 0, color: PALETTE.accentEmphasis2 }}>{title}</h1>
        <p style={{ ...TEXT.body, margin: 0, color: PALETTE.textSoft }}>{body}</p>
      </div>

      {children}
    </div>
  )
}
