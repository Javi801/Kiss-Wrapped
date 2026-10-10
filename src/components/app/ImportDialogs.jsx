import { CheckCircle2, TriangleAlert, Upload } from 'lucide-react'

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
import ImportPartnerDialogs from '@/components/app/ImportPartnerDialogs'

const titleRowStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem' }
const iconStyle = { height: '1.25rem', width: '1.25rem', flexShrink: 0 }
const descriptionStyle = { display: 'flex', flexDirection: 'column', gap: '0.25rem' }

/**
 * Dialogs of the JSON import, one per `importStatus.type`: confirmation, partner
 * issues, success, nothing to import and invalid file.
 * The state lives in the parent's `importStatus`.
 */
export default function ImportDialogs({
  importStatus,
  t,
  onClose,
  onConfirm,
  onFix,
  onSkip,
  onBack,
  onRowChange,
  onImport,
}) {
  const PALETTE = usePalette()

  const contentStyle = { background: PALETTE.bgSoft, borderColor: PALETTE.line }
  const closeOnDismiss = (open) => {
    if (!open) onClose()
  }

  return (
    <>
      {/* Import confirm dialog */}
      <Dialog open={importStatus?.type === 'confirm'} onOpenChange={closeOnDismiss}>
        <DialogContent showCloseButton={false} className="rounded-2xl" style={contentStyle}>
          <DialogHeader>
            <div style={{ ...titleRowStyle, color: PALETTE.accentEmphasis2 }}>
              <Upload style={iconStyle} />
              <DialogTitle style={{ color: PALETTE.accentEmphasis2 }}>
                {t.importJsonConfirmTitle}
              </DialogTitle>
            </div>
            <DialogDescription asChild>
              <div style={{ ...descriptionStyle, color: PALETTE.textSoft }}>
                <span>
                  <strong style={{ color: PALETTE.text }}>{importStatus?.totalInFile}</strong>{' '}
                  {t.importJsonConfirmPeople}
                </span>
                <span>
                  <strong style={{ color: PALETTE.text }}>{importStatus?.newCount}</strong>{' '}
                  {t.importJsonConfirmNew}
                </span>
                {importStatus?.skippedCount > 0 && (
                  <span>
                    <strong style={{ color: PALETTE.text }}>{importStatus?.skippedCount}</strong>{' '}
                    {t.importJsonConfirmSkipped}
                  </span>
                )}
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
              {t.cancel}
            </Button>
            <Button
              className="rounded-xl"
              style={{
                background: `linear-gradient(90deg, ${PALETTE.accentEmphasis2}, ${PALETTE.emphasisEnd})`,
                color: PALETTE.textOnAccent,
                border: 'none',
              }}
              onClick={onConfirm}
            >
              {t.importJsonConfirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportPartnerDialogs
        importStatus={importStatus}
        t={t}
        onCancel={onClose}
        onFix={onFix}
        onSkip={onSkip}
        onBack={onBack}
        onRowChange={onRowChange}
        onImport={onImport}
      />

      {/* Import success dialog */}
      <Dialog open={importStatus?.type === 'success'} onOpenChange={closeOnDismiss}>
        <DialogContent showCloseButton={false} className="rounded-2xl" style={contentStyle}>
          <DialogHeader>
            <div style={{ ...titleRowStyle, color: PALETTE.accent }}>
              <CheckCircle2 style={iconStyle} />
              <DialogTitle style={{ color: PALETTE.accent }}>
                {t.importJsonSuccessTitle}
              </DialogTitle>
            </div>
            <DialogDescription asChild>
              <div style={{ ...descriptionStyle, color: PALETTE.textSoft }}>
                <span>
                  <strong style={{ color: PALETTE.text }}>{importStatus?.newCount}</strong>{' '}
                  {t.importJsonSuccessDesc}
                </span>
                {importStatus?.skippedIssueCount > 0 && (
                  <span>
                    <strong style={{ color: PALETTE.text }}>
                      {importStatus?.skippedIssueCount}
                    </strong>{' '}
                    {t.importJsonSuccessSkipped}
                  </span>
                )}
                {importStatus?.discardedCount > 0 && (
                  <span>
                    <strong style={{ color: PALETTE.text }}>{importStatus?.discardedCount}</strong>{' '}
                    {t.importJsonSuccessDiscarded}
                  </span>
                )}
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

      {/* Import empty dialog (all people already exist) */}
      <Dialog open={importStatus?.type === 'empty'} onOpenChange={closeOnDismiss}>
        <DialogContent showCloseButton={false} className="rounded-2xl" style={contentStyle}>
          <DialogHeader>
            <div style={{ ...titleRowStyle, color: PALETTE.textSoft }}>
              <Upload style={iconStyle} />
              <DialogTitle style={{ color: PALETTE.text }}>{t.importJsonEmptyTitle}</DialogTitle>
            </div>
            <DialogDescription style={{ color: PALETTE.textSoft }}>
              {t.importJsonEmptyDesc}
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

      {/* Import error dialog (invalid type or invalid format) */}
      <Dialog
        open={importStatus?.type === 'error_type' || importStatus?.type === 'error_format'}
        onOpenChange={closeOnDismiss}
      >
        <DialogContent showCloseButton={false} className="rounded-2xl" style={contentStyle}>
          <DialogHeader>
            <div style={{ ...titleRowStyle, color: PALETTE.accentEmphasis }}>
              <TriangleAlert style={iconStyle} />
              <DialogTitle style={{ color: PALETTE.accentEmphasis }}>
                {importStatus?.type === 'error_type'
                  ? t.importJsonErrorTypeTitle
                  : t.importJsonErrorFormatTitle}
              </DialogTitle>
            </div>
            <DialogDescription style={{ color: PALETTE.textSoft }}>
              {importStatus?.type === 'error_type'
                ? t.importJsonErrorTypeDesc
                : t.importJsonErrorFormatDesc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="rounded-xl"
              style={{
                background: PALETTE.accentEmphasis,
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
    </>
  )
}
