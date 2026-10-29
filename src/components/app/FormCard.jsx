import { Card, CardContent } from '@/components/ui/card'
import { usePalette } from '@/lib/theme'

/**
 * Card container for a full-screen form: the add-person screen and the onboarding form steps.
 *
 * Props:
 *  - children  Form shown inside the card
 */
export default function FormCard({ children }) {
  const PALETTE = usePalette()

  return (
    <Card
      className="rounded-3xl"
      style={{
        boxShadow: `0 4px 24px ${PALETTE.shadow}, 0 0 0 1px ${PALETTE.cardBorder}`,
        backdropFilter: 'blur(12px)',
        border: 'none',
        background: `linear-gradient(160deg, ${PALETTE.card} 0%, ${PALETTE.cardSoft} 100%)`,
      }}
    >
      <CardContent style={{ padding: '1.25rem' }}>{children}</CardContent>
    </Card>
  )
}
