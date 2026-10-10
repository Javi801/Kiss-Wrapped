import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

import PersonForm from '@/components/forms/PersonForm'
import EventForm from '@/components/forms/EventForm'

/**
 * Edit-person and add/edit-event dialogs of a person card. The open state is
 * owned by the card (see usePersonCardModals) and passed in.
 */
export default function PersonCardDialogs({
  person,
  editingPerson,
  setEditingPerson,
  eventModal,
  setEventModal,
  onUpdatePerson,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  t,
  language,
  situationTags,
  onAddSituationTag,
  placeTags,
  onAddPlaceTag,
  howWeMetTags,
  onAddHowWeMetTag,
}) {
  return (
    <>
      {/* Edit person modal */}
      <Dialog open={editingPerson} onOpenChange={setEditingPerson}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editPerson}</DialogTitle>
            <DialogDescription>{t.updateDetails}</DialogDescription>
          </DialogHeader>

          <PersonForm
            initialValues={person}
            onSave={(values) => {
              onUpdatePerson(person.id, values)
              setEditingPerson(false)
            }}
            onCancel={() => setEditingPerson(false)}
            t={t}
            language={language}
            includeRealName
            includePartner
            howWeMetTags={howWeMetTags}
            onAddHowWeMetTag={onAddHowWeMetTag}
            isParentOpen={editingPerson}
          />
        </DialogContent>
      </Dialog>

      {/* Event modal */}
      <Dialog
        open={eventModal.open}
        onOpenChange={(open) => setEventModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {eventModal.mode === 'add' ? t.addEventTitle : t.editEventTitle}
            </DialogTitle>
            <DialogDescription>
              {eventModal.mode === 'add' ? t.addEventDesc : t.editEventDesc}
            </DialogDescription>
          </DialogHeader>

          <EventForm
            initialValues={eventModal.event}
            onSave={(values) => {
              if (eventModal.mode === 'add') onAddEvent(person.id, values)
              else onUpdateEvent(person.id, eventModal.event.id, values)

              setEventModal({ open: false, mode: 'add', event: null })
            }}
            onCancel={() => setEventModal({ open: false, mode: 'add', event: null })}
            onDelete={
              eventModal.mode === 'edit'
                ? () => {
                    onDeleteEvent(person.id, eventModal.event.id)
                    setEventModal({ open: false, mode: 'add', event: null })
                  }
                : undefined
            }
            t={t}
            situationTags={situationTags}
            onAddSituationTag={onAddSituationTag}
            placeTags={placeTags}
            onAddPlaceTag={onAddPlaceTag}
            isParentOpen={eventModal.open}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
