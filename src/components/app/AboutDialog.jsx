import { ExternalLink, Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

import { TEXT } from '@/lib/constants'
import { APP_VERSION, APP_GITHUB_USER, APP_GITHUB_REPO } from '@/lib/config'
import { usePalette } from '@/lib/theme'
import {
  SETTINGS_DIALOG_CLASS,
  SETTINGS_OVERLAY_CLASS,
} from '@/components/app/settingsDialogTransition'

/**
 * About dialog: app name, version, description and the link for feedback.
 */
export default function AboutDialog({ open, onOpenChange, t }) {
  const PALETTE = usePalette()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`rounded-2xl ${SETTINGS_DIALOG_CLASS}`}
        overlayClassName={SETTINGS_OVERLAY_CLASS}
        style={{ background: PALETTE.dialogBg, borderColor: PALETTE.dialogBorder }}
      >
        <DialogHeader>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: '3.5rem',
                height: '3.5rem',
                background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 14px ${PALETTE.accentGlow}`,
              }}
            >
              <Info style={{ height: '1.5rem', width: '1.5rem', color: PALETTE.textOnAccent }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <DialogTitle style={{ ...TEXT.subheading, color: PALETTE.accentEmphasis2 }}>
                {t.appTitle}
              </DialogTitle>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '0.25rem',
                  padding: '0.125rem 0.625rem',
                  borderRadius: '9999px',
                  backgroundColor: PALETTE.accentMuted,
                  color: PALETTE.accent,
                  ...TEXT.caption,
                  fontWeight: '600',
                }}
              >
                {t.aboutVersion} {APP_VERSION}
              </span>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription asChild>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p
              style={{
                ...TEXT.caption,
                color: PALETTE.textSoft,
                textAlign: 'center',
                lineHeight: '1.5',
              }}
            >
              {t.aboutDescription}
            </p>

            <div style={{ height: '1px', backgroundColor: PALETTE.line }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ ...TEXT.label, color: PALETTE.textSoft }}>{t.aboutFeedback}</span>
              <p style={{ ...TEXT.caption, color: PALETTE.textSoft }}>{t.aboutFeedbackDesc}</p>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                style={{
                  height: '2.75rem',
                  justifyContent: 'flex-start',
                  ...TEXT.caption,
                  borderColor: PALETTE.inputBorder,
                  backgroundColor: PALETTE.controlBg,
                  color: PALETTE.text,
                }}
                onClick={() => window.open(APP_GITHUB_REPO, '_blank')}
              >
                <ExternalLink
                  style={{
                    marginRight: '0.75rem',
                    height: '1rem',
                    width: '1rem',
                    color: PALETTE.accent,
                  }}
                />
                {APP_GITHUB_USER}
              </Button>
            </div>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}
