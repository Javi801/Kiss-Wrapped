import { usePalette } from '@/lib/theme'

/**
 * Shared tooltip for category charts (pie, donut, bar).
 * Uses the cartesian `label` when present (bar charts) and falls back to the
 * slice name from the payload (pie/donut charts).
 */
export default function ChartTooltip({ active, payload, label, tooltipUnit }) {
  const PALETTE = usePalette()
  if (!active || !payload?.length) return null
  const value = payload[0].value
  const name = label ?? payload[0].name
  const unit = value === 1 ? tooltipUnit.one : tooltipUnit.many
  return (
    <div
      style={{
        background: PALETTE.card,
        border: `1px solid ${PALETTE.line}`,
        color: PALETTE.text,
        borderRadius: '0.5rem',
        padding: '0.5rem 0.75rem',
        fontSize: 13,
      }}
    >
      <p style={{ marginBottom: '0.2rem', fontWeight: 500 }}>{name}</p>
      <p>{`${value} ${unit}`}</p>
    </div>
  )
}
