import { CheckCircle2, TriangleAlert } from 'lucide-react'

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
import { saveErrorLog } from '@/lib/pdf-export'

/**
 * Result dialogs of the JSON export: the success notice and the error with the
 * option to save a log.
 * `status` is null when idle, `{ fileName, isNative, hadMissingFields }` on success
 * and an Error on failure.
 */
export default function JsonExportDialogs({ status, t, onClose }) {
  const PALETTE = usePalette()

  return (
    <>
      {/* JSON export success dialog */}
      <Dialog
        open={status !== null && !(status instanceof Error)}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="rounded-2xl"
          style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}
        >
          <DialogHeader>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: status?.hadMissingFields ? PALETTE.warningBadgeText : PALETTE.accent,
              }}
            >
              {status?.hadMissingFields ? (
                <TriangleAlert style={{ height: '1.25rem', width: '1.25rem', flexShrink: 0 }} />
              ) : (
                <CheckCircle2 style={{ height: '1.25rem', width: '1.25rem', flexShrink: 0 }} />
              )}
              <DialogTitle
                style={{
                  color: status?.hadMissingFields ? PALETTE.warningBadgeText : PALETTE.accent,
                }}
              >
                {status?.hadMissingFields
                  ? t.exportJsonSuccessWithWarningsTitle
                  : t.exportJsonSuccessTitle}
              </DialogTitle>
            </div>
            <DialogDescription asChild>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  color: PALETTE.textSoft,
                }}
              >
                {status?.hadMissingFields && <span>{t.exportJsonSuccessWithWarningsDesc}</span>}
                <span>
                  {t.exportJsonSavedAs}:{' '}
                  <strong style={{ color: PALETTE.text, fontFamily: 'monospace' }}>
                    {status?.fileName}
                  </strong>
                </span>
                <span>
                  {status?.isNative ? t.exportJsonLocationNative : t.exportJsonLocationWeb}
                </span>
              </div>
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
              {t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* JSON export error dialog */}
      <Dialog
        open={status instanceof Error}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="rounded-2xl"
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
                {t.exportJsonErrorTitle}
              </DialogTitle>
            </div>
            <DialogDescription asChild>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  color: PALETTE.textSoft,
                }}
              >
                <span>{status?.message || t.exportJsonErrorDesc}</span>
              </div>
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
              onClick={() => {
                saveErrorLog(status).catch(console.error)
                onClose()
              }}
            >
              {t.saveJsonErrorLog}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
