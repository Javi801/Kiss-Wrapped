import { Card, CardContent } from '@/components/ui/card'
import { usePalette } from '@/lib/theme'

/**
 * Shared card shell used by StatTile and SettingsTile.
 * Edit padding, rounding, shadow, or blur here to affect both.
 */
export default function TileCard({ accent = false, children, contentStyle }) {
  const PALETTE = usePalette()
  const borderColor = accent ? 'rgba(255,255,255,0.25)' : PALETTE.cardBorder
  const background = accent ? 'rgba(255,255,255,0.22)' : PALETTE.cardBg

  return (
    <Card
      className="rounded-3xl"
      style={{
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        borderColor,
        background,
        backdropFilter: 'blur(8px)',
      }}
    >
      <CardContent style={{ padding: '1.25rem', ...contentStyle }}>{children}</CardContent>
    </Card>
  )
}
