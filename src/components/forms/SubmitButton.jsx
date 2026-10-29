import { Button } from '@/components/ui/button'

import { usePalette } from '@/lib/theme'

/**
 * Primary action of a form: submits it and fills the free width with the accent gradient.
 */
export default function SubmitButton({ children }) {
  const PALETTE = usePalette()
  return (
    <Button
      type="submit"
      className="rounded-2xl"
      style={{
        flex: '1 1 0%',
        color: PALETTE.textOnAccent,
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
        // The gradient would repeat under the default transparent border.
        border: 'none',
      }}
    >
      {children}
    </Button>
  )
}
