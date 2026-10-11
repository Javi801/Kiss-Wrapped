import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

/**
 * Short notice shown on the main screen right after the onboarding ends: where
 * to find the rest of the help.
 */
export default function OnboardingDoneDialog({ open, onClose, t }) {
  const PALETTE = usePalette()

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {/* Same dark backdrop as the tour, so the notice does not blend into the home screen. */}
      <DialogContent showCloseButton={false} overlayStyle={{ backgroundColor: PALETTE.backdrop }}>
        <DialogHeader>
          <DialogTitle style={{ ...TEXT.subheading, color: PALETTE.accentEmphasis2 }}>
            {t.onboardingDoneTitle}
          </DialogTitle>
          <DialogDescription style={{ ...TEXT.base, color: PALETTE.text }}>
            {t.onboardingDoneBody}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            className="rounded-xl"
            style={{
              background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
              color: PALETTE.textOnAccent,
              border: 'none',
            }}
            onClick={onClose}
          >
            {t.onboardingDoneAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
