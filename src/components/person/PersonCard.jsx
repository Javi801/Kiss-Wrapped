import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { Card, CardContent } from '@/components/ui/card'

import { usePalette } from '@/lib/theme'
import { personHasIncompleteEvent, personIsMissingRequired } from '@/lib/format'
import { TOUR_TARGETS } from '@/lib/onboarding'

import PersonCardHeader from '@/components/person/PersonCardHeader'
import PersonCardDetails from '@/components/person/PersonCardDetails'
import PersonCardActions from '@/components/person/PersonCardActions'
import PersonEventList from '@/components/person/PersonEventList'
import PersonCardDialogs from '@/components/person/PersonCardDialogs'
import usePersonCardModals from '@/components/person/usePersonCardModals'

/**
 * Displays a person card with expandable event history.
 * Handles editing, deleting, and event management.
 * `tour` puts the card under the onboarding tour, which then decides whether it is
 * expanded: `{ expanded, tapTarget, editHint, eventHint, onToggle, onAddEvent }`, where
 * `tapTarget` is `TOUR_TARGETS.card` or `TOUR_TARGETS.addEvent`.
 */
export default function PersonCard({
  person,
  onUpdatePerson,
  onDeletePerson,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onDeleteAllEvents,
  t,
  language,
  modalBackRef,
  situationTags,
  onAddSituationTag,
  placeTags,
  onAddPlaceTag,
  howWeMetTags,
  onAddHowWeMetTag,
  tour,
}) {
  const PALETTE = usePalette()
  // Expand/collapse state.
  const [ownExpanded, setExpanded] = useState(false)
  const expanded = tour ? tour.expanded : ownExpanded

  // Modal states.
  const { editingPerson, setEditingPerson, eventModal, setEventModal } =
    usePersonCardModals(modalBackRef)

  // Check if any event lacks details.
  const hasIncompleteEvent = personHasIncompleteEvent(person)

  // Sort events descending by date.
  const sortedEvents = useMemo(
    () => [...(person.events || [])].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [person.events]
  )

  return (
    <>
      <motion.div layout style={{ paddingBottom: '0.375rem' }}>
        <Card
          className="rounded-3xl"
          style={{
            overflow: 'hidden',
            boxShadow: hasIncompleteEvent
              ? `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), inset 0 0 0 2px ${PALETTE.warningBorder}`
              : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            borderColor: hasIncompleteEvent ? PALETTE.warningBorder : PALETTE.cardBorder,
            background: `linear-gradient(180deg, ${PALETTE.cardSoft}, ${PALETTE.accentMuted})`,
          }}
        >
          <CardContent style={{ padding: 0 }}>
            <PersonCardHeader
              person={person}
              expanded={expanded}
              onToggle={tour?.onToggle ?? (() => setExpanded((v) => !v))}
              hasIncompleteEvent={hasIncompleteEvent}
              showTapGuide={tour?.tapTarget === TOUR_TARGETS.card}
              t={t}
            />

            {/* Expandable content */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      padding: '0rem 1.25rem 1.25rem',
                    }}
                  >
                    <PersonCardDetails person={person} t={t} language={language} />

                    <PersonCardActions
                      hasEvents={sortedEvents.length > 0}
                      personIncomplete={personIsMissingRequired(person)}
                      onEditPerson={() => setEditingPerson(true)}
                      onAddEvent={
                        tour?.onAddEvent ??
                        (() => setEventModal({ open: true, mode: 'add', event: null }))
                      }
                      editHint={tour?.editHint}
                      showTapGuide={tour?.tapTarget === TOUR_TARGETS.addEvent}
                      onDeletePerson={() => onDeletePerson(person.id)}
                      onDeleteAllEvents={() => onDeleteAllEvents(person.id)}
                      t={t}
                    />

                    <PersonEventList
                      events={sortedEvents}
                      onSelectEvent={(event) => setEventModal({ open: true, mode: 'edit', event })}
                      hint={tour?.eventHint}
                      t={t}
                      language={language}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      <PersonCardDialogs
        person={person}
        editingPerson={editingPerson}
        setEditingPerson={setEditingPerson}
        eventModal={eventModal}
        setEventModal={setEventModal}
        onUpdatePerson={onUpdatePerson}
        onAddEvent={onAddEvent}
        onUpdateEvent={onUpdateEvent}
        onDeleteEvent={onDeleteEvent}
        t={t}
        language={language}
        situationTags={situationTags}
        onAddSituationTag={onAddSituationTag}
        placeTags={placeTags}
        onAddPlaceTag={onAddPlaceTag}
        howWeMetTags={howWeMetTags}
        onAddHowWeMetTag={onAddHowWeMetTag}
      />
    </>
  )
}
