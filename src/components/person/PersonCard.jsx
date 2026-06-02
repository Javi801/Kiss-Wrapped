import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Plus, Trash2, Calendar, ChevronDown, ChevronUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";

import { TEXT, abbreviateZodiacMonths } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import { formatShortDate, calculateDisplayAge } from "@/lib/date";
import {
  translateActivity,
  translateGender,
  hasScore,
  renderKisses,
  personHasIncompleteEvent,
  eventIsMissingRequired,
} from "@/lib/format";

import PersonForm from "@/components/forms/PersonForm";
import EventForm from "@/components/forms/EventForm";

/**
 * Displays a person card with expandable event history.
 * Handles editing, deleting, and event management.
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
}) {
  const PALETTE = usePalette();
  // Expand/collapse state.
  const [expanded, setExpanded] = useState(false);

  // Modal states.
  const [editingPerson, setEditingPerson] = useState(false);
  const [eventModal, setEventModal] = useState({
    open: false,
    mode: "add",
    event: null,
  });

  useEffect(() => {
    if (!modalBackRef) return;
    modalBackRef.current = editingPerson ? () => setEditingPerson(false) : null;
    return () => { if (editingPerson) modalBackRef.current = null; };
  }, [editingPerson, modalBackRef]);

  useEffect(() => {
    if (!modalBackRef) return;
    modalBackRef.current = eventModal.open
      ? () => setEventModal((prev) => ({ ...prev, open: false }))
      : null;
    return () => { if (eventModal.open) modalBackRef.current = null; };
  }, [eventModal.open, modalBackRef]);

  // Check if any event lacks details.
  const hasIncompleteEvent = personHasIncompleteEvent(person);

  // Sort events descending by date.
  const sortedEvents = useMemo(
    () =>
      [...(person.events || [])].sort((a, b) =>
        a.date < b.date ? 1 : -1,
      ),
    [person.events],
  );

  return (
    <>
      <motion.div layout style={{ paddingBottom: "0.375rem" }}>
        <Card
          className="rounded-3xl"
          style={{
            overflow: "hidden",
            boxShadow: hasIncompleteEvent
              ? "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 0 0 2px #f9d58a"
              : "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            borderColor: hasIncompleteEvent ? "#f9d58a" : PALETTE.cardBorder,
            background: `linear-gradient(180deg, ${PALETTE.cardSoft}, ${PALETTE.accentMuted})`,
          }}
        >
          <CardContent style={{ padding: 0 }}>
            {/* Header */}
            <button
              style={{ display: "flex", width: "100%", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", padding: "1.25rem", textAlign: "left" }}
              onClick={() => setExpanded((v) => !v)}
            >
              <div style={{ minWidth: 0, flex: "1 1 0%" }}>
                {/* Name + badges */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
                  <h3
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...TEXT.title, color: PALETTE.text }}
                  >
                    {person.name}
                  </h3>

                  {hasIncompleteEvent && (
                    <Badge className="rounded-full" style={{ border: "none", backgroundColor: "#fef3c7", color: "#b45309" }}>
                      {t.missingEventDetailsBadge}
                    </Badge>
                  )}
                </div>

                {/* Basic info */}
                <div
                  style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", ...TEXT.caption, color: PALETTE.textSoft }}
                >
                  <span>{calculateDisplayAge(person.birthYear, person.zodiacSign, person.birthdayAlreadyHappened) ?? person.age} {t.years}</span>
                  <span>•</span>
                  <span>{translateGender(person.gender, t)}</span>
                  <span>•</span>
                  <span>{translateActivity(person.activity, t)}</span>
                  <span>•</span>
                  <span>{abbreviateZodiacMonths(person.zodiacSign)}</span>
                </div>

              </div>

              {/* Toggle icon */}
              <div className="rounded-2xl" style={{ padding: "0.5rem", backgroundColor: PALETTE.accentMuted }}>
                {expanded ? (
                  <ChevronUp style={{ height: "1.25rem", width: "1.25rem", color: PALETTE.accent }} />
                ) : (
                  <ChevronDown style={{ height: "1.25rem", width: "1.25rem", color: PALETTE.accent }} />
                )}
              </div>
            </button>

            {/* Expandable content */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0rem 1.25rem 1.25rem" }}>
                    {/* Extra info */}
                    {(person.realName || person.howWeMet || person.detail) && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {person.realName && (
                          <p style={{ ...TEXT.body, color: PALETTE.text }}>
                            {t.realName}: {person.realName}
                          </p>
                        )}
                        {person.howWeMet && (
                          <p style={{ ...TEXT.body, color: PALETTE.text }}>
                            {t.met}: {person.howWeMet}
                          </p>
                        )}
                        {person.detail && (
                          <p style={{ ...TEXT.body, color: PALETTE.textSoft }}>
                            {person.detail}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      <Button
                        onClick={() => setEditingPerson(true)}
                        style={{ background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`, color: "white", border: "none" }}
                      >
                        <Pencil style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }} />
                        {t.editPerson}
                      </Button>

                      <Button
                        onClick={() =>
                          setEventModal({ open: true, mode: "add", event: null })
                        }
                        style={{ background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`, color: "white", border: "none" }}
                      >
                        <Plus style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }} />
                        {t.addEvent}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" style={{ color: "#dc2626" }}>
                            <Trash2 style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }} />
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
                              style={{ background: "#ef4444", color: "white" }}
                              onClick={() => onDeletePerson(person.id)}
                            >
                              {t.deletePersonConfirmAction}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      {sortedEvents.length > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" style={{ color: "#dc2626" }}>
                              <Trash2 style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }} />
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
                                style={{ background: "#ef4444", color: "white" }}
                                onClick={() => onDeleteAllEvents(person.id)}
                              >
                                {t.deleteAllEventsConfirmAction}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>

                    {/* Event list */}
                    {sortedEvents.length ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {sortedEvents.map((event) => (
                          <button
                            key={event.id}
                            className="rounded-2xl"
                            style={{
                              width: "100%",
                              border: eventIsMissingRequired(event) ? "1px solid #f9d58a" : `1px solid ${PALETTE.innerCardBorder}`,
                              backgroundColor: eventIsMissingRequired(event) ? "rgba(249,213,138,0.08)" : PALETTE.card,
                              padding: "0.75rem",
                              textAlign: "left",
                            }}
                            onClick={() =>
                              setEventModal({
                                open: true,
                                mode: "edit",
                                event,
                              })
                            }
                          >
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>
                                <Calendar style={{ display: "inline", marginRight: "0.5rem", height: "1rem", width: "1rem" }} />
                                {formatShortDate(event.date, language)}
                              </span>

                              {hasScore(event.score) && (
                                <Badge style={{ backgroundColor: PALETTE.accentShadow, color: PALETTE.accent, border: "none" }}>{renderKisses(event.score, t)}</Badge>
                              )}
                            </div>

                            {(event.place || event.situation) && (
                              <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.25rem 0.75rem", ...TEXT.caption, color: PALETTE.textSoft }}>
                                {event.place && (
                                  <span><strong>{t.eventPlace}:</strong> {event.place}</span>
                                )}
                                {event.situation && (
                                  <span><strong>{t.eventSituation}:</strong> {event.situation}</span>
                                )}
                              </div>
                            )}

                            <p style={{ marginTop: "0.5rem", ...TEXT.body, color: PALETTE.textSoft }}>
                              {event.details || t.noDetailsAdded}
                            </p>

                            {event.observations && (
                              <p style={{ marginTop: "0.25rem", ...TEXT.caption, color: PALETTE.textSoft }}>
                                {event.observations}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p style={{ ...TEXT.body, textAlign: "center" }}>{t.noEventsYet}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

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
              onUpdatePerson(person.id, values);
              setEditingPerson(false);
            }}
            onCancel={() => setEditingPerson(false)}
            t={t}
            language={language}
            includeRealName
            howWeMetTags={howWeMetTags}
            onAddHowWeMetTag={onAddHowWeMetTag}
            isParentOpen={editingPerson}
          />
        </DialogContent>
      </Dialog>

      {/* Event modal */}
      <Dialog
        open={eventModal.open}
        onOpenChange={(open) =>
          setEventModal((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {eventModal.mode === "add"
                ? t.addEventTitle
                : t.editEventTitle}
            </DialogTitle>
            <DialogDescription>
              {eventModal.mode === "add"
                ? t.addEventDesc
                : t.editEventDesc}
            </DialogDescription>
          </DialogHeader>

          <EventForm
            initialValues={eventModal.event}
            onSave={(values) => {
              if (eventModal.mode === "add")
                onAddEvent(person.id, values);
              else
                onUpdateEvent(person.id, eventModal.event.id, values);

              setEventModal({ open: false, mode: "add", event: null });
            }}
            onCancel={() =>
              setEventModal({ open: false, mode: "add", event: null })
            }
            onDelete={eventModal.mode === "edit" ? () => {
              onDeleteEvent(person.id, eventModal.event.id);
              setEventModal({ open: false, mode: "add", event: null });
            } : undefined}
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
  );
}
