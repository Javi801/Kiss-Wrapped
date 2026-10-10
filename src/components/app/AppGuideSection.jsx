import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

/**
 * One section of the app guide: an icon, a title and its texts, shown as a
 * list when there are several.
 *
 * Props:
 *  - icon   Lucide icon component
 *  - title  Section title
 *  - items  Texts of the section
 */
export default function AppGuideSection({ icon: Icon, title, items }) {
  const PALETTE = usePalette()
  const textStyle = { ...TEXT.caption, lineHeight: '1.5', color: PALETTE.textSoft }

  return (
    <section
      className="rounded-2xl"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0.875rem',
        border: `1px solid ${PALETTE.line}`,
        backgroundColor: PALETTE.card,
      }}
    >
      <h3
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0,
          ...TEXT.bodyStrong,
          color: PALETTE.accentEmphasis2,
        }}
      >
        <Icon style={{ height: '1rem', width: '1rem', flexShrink: 0, color: PALETTE.accent }} />
        {title}
      </h3>

      {items.length === 1 ? (
        <p style={{ ...textStyle, margin: 0 }}>{items[0]}</p>
      ) : (
        <ul
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
            margin: 0,
            paddingLeft: '1.125rem',
            listStyleType: 'disc',
          }}
        >
          {items.map((item) => (
            <li key={item} style={textStyle}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
