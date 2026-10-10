import { BookOpen } from 'lucide-react'

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
import AppGuideSection from '@/components/app/AppGuideSection'
import { APP_GUIDE_SECTIONS } from '@/components/app/appGuideSections'

/**
 * App guide opened from the settings: what the onboarding does not show.
 * Its content comes from `APP_GUIDE_SECTIONS`.
 */
export default function AppGuideDialog({ open, onOpenChange, t }) {
  const PALETTE = usePalette()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="rounded-2xl"
        style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}
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
              <BookOpen style={{ height: '1.5rem', width: '1.5rem', color: 'white' }} />
            </div>
            <DialogTitle style={{ ...TEXT.subheading, color: PALETTE.accentEmphasis2 }}>
              {t.appGuide}
            </DialogTitle>
          </div>
        </DialogHeader>

        <DialogDescription asChild>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ ...TEXT.caption, margin: 0, textAlign: 'center', color: PALETTE.textSoft }}>
              {t.appGuideIntro}
            </p>
            {APP_GUIDE_SECTIONS.map((section) => (
              <AppGuideSection
                key={section.id}
                icon={section.icon}
                title={t[section.title]}
                items={section.items.map((item) => t[item])}
              />
            ))}
          </div>
        </DialogDescription>

        <DialogFooter>
          <Button
            className="rounded-xl"
            style={{
              background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
              color: 'white',
              border: 'none',
            }}
            onClick={() => onOpenChange(false)}
          >
            {t.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
