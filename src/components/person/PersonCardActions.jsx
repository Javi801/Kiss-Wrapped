import { Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { usePalette } from '@/lib/theme'
import SpeechBubble from '@/components/forms/SpeechBubble'
import TapGuide from '@/components/visuals/TapGuide'

/**
 * Action row of an expanded person card: edit person, add event, and the
 * confirmed delete-person / delete-all-events buttons. The edit button is
 * highlighted when the person's own profile is missing required fields.
 * For the onboarding tour, `editHint` adds a speech bubble pointing at the edit
 * button and `showTapGuide` puts the tap guide on the add-event button, the
 * only one the tour then leaves reachable (`data-tour-target`).
 */
export default function PersonCardActions({
  hasEvents,
  personIncomplete,
  onEditPerson,
  onAddEvent,
  onDeletePerson,
  onDeleteAllEvents,
  editHint,
  showTapGuide,
  t,
}) {
  const PALETTE = usePalette()

  const actions = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      <Button
        onClick={onEditPerson}
        style={{
          background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
          color: PALETTE.textOnAccent,
          border: personIncomplete ? `2px solid ${PALETTE.warningBorder}` : 'none',
        }}
      >
        <Pencil style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />
        {t.editPerson}
      </Button>

      <Button
        onClick={onAddEvent}
        data-tour-target={showTapGuide ? '' : undefined}
        style={{
          background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
          color: PALETTE.textOnAccent,
          border: 'none',
          ...(showTapGuide ? { position: 'relative', pointerEvents: 'auto' } : null),
        }}
      >
        {showTapGuide && <TapGuide />}
        <Plus style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />
        {t.addEvent}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" style={{ color: PALETTE.dangerEmphasis }}>
            <Trash2 style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />
            {t.deletePerson}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deletePersonConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.deletePersonConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              style={{ background: PALETTE.danger, color: PALETTE.textOnAccent }}
              onClick={onDeletePerson}
            >
              {t.deletePersonConfirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {hasEvents && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" style={{ color: PALETTE.dangerEmphasis }}>
              <Trash2 style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />
              {t.deleteAllEvents}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.deleteAllEventsConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{t.deleteAllEventsConfirmDesc}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction
                style={{ background: PALETTE.danger, color: PALETTE.textOnAccent }}
                onClick={onDeleteAllEvents}
              >
                {t.deleteAllEventsConfirmAction}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )

  if (!editHint) return actions

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <SpeechBubble tailSide="bottom">{editHint}</SpeechBubble>
      {actions}
    </div>
  )
}
