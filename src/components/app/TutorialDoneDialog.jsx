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
 * Short notice shown on the main screen right after the tutorial ends: where
 * to find the rest of the help.
 */
export default function TutorialDoneDialog({ open, onClose, t }) {
  const PALETTE = usePalette()

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {/* Same dark backdrop as the tour, so the notice does not blend into the home screen. */}
      <DialogContent showCloseButton={false} overlayClassName="bg-[rgba(24,14,34,0.6)]">
        <DialogHeader>
          <DialogTitle style={{ ...TEXT.subheading, color: PALETTE.accentEmphasis2 }}>
            {t.tutorialDoneTitle}
          </DialogTitle>
          <DialogDescription style={{ ...TEXT.base, color: PALETTE.text }}>
            {t.tutorialDoneBody}
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
            {t.tutorialDoneAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
