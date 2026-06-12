import TileCard from './TileCard'
import { tileColors } from './tileColors'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

export default function StatTile({ label, value, helper, accent = false }) {
  const PALETTE = usePalette()
  const colors = tileColors(accent, PALETTE)

  return (
    <TileCard accent={accent}>
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
        {value}
      </p>

      {helper ? (
        <p style={{ marginTop: '0.25rem', ...TEXT.body, color: colors.helper }}>{helper}</p>
      ) : null}
    </TileCard>
  )
}
