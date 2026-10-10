import { TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

import { usePalette } from '@/lib/theme'

/**
 * Error dialog of the chart image download, with the option to share a log.
 * `message` is empty when there is no error. It stacks above the fullscreen
 * chart, which sits over the default dialog layer.
 */
export default function ChartDownloadErrorDialog({ message, sharingLog, t, onShareLog, onClose }) {
  const PALETTE = usePalette()

  return (
    <Dialog
      open={message !== ''}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="z-[10003] rounded-2xl"
        overlayClassName="z-[10002]"
        style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}
      >
        <DialogHeader>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: PALETTE.accentEmphasis,
            }}
          >
            <TriangleAlert style={{ height: '1.25rem', width: '1.25rem', flexShrink: 0 }} />
            <DialogTitle style={{ color: PALETTE.accentEmphasis }}>
              {t.chartDownloadErrorTitle}
            </DialogTitle>
          </div>
          <DialogDescription style={{ color: PALETTE.textSoft, overflowWrap: 'anywhere' }}>
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-xl"
            style={{ borderColor: PALETTE.line, color: PALETTE.text }}
            onClick={onClose}
          >
            {t.close}
          </Button>
          <Button
            className="rounded-xl"
            style={{
              background: PALETTE.accentEmphasis,
              color: PALETTE.textOnAccent,
              border: 'none',
            }}
            disabled={sharingLog}
            onClick={onShareLog}
          >
            {t.chartShareLog}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
