import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { SCORE_OPTIONS, TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import { todayString, isValidDateString, isFutureDate } from "@/lib/date";
import { hasScore, renderKisses } from "@/lib/format";

export default function EventForm({ initialValues, onSave, onCancel, onDelete, t, situationTags = [], onAddSituationTag, placeTags = [], onAddPlaceTag }) {
  const PALETTE = usePalette();
  const [date, setDate] = useState(initialValues?.date || todayString());
  const [details, setDetails] = useState(initialValues?.details || "");
  const [score, setScore] = useState(
    hasScore(initialValues?.score) ? String(initialValues.score) : "none",
  );
  const [place, setPlace] = useState(initialValues?.place || "");
  const [situation, setSituation] = useState(initialValues?.situation || "");
  const [observations, setObservations] = useState(initialValues?.observations || "");

  const [addingTag, setAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState("");
  const newTagInputRef = useRef(null);

  const [addingPlaceTag, setAddingPlaceTag] = useState(false);
  const [newPlaceTagText, setNewPlaceTagText] = useState("");

  const [errors, setErrors] = useState({});

  function submit(e) {
    e.preventDefault();

    const newErrors = {};
    if (!isValidDateString(date)) newErrors.date = t.validDateMsg;
    else if (isFutureDate(date)) newErrors.date = t.futureDateMsg;
    if (!place.trim()) newErrors.place = t.requiredPlace;
    if (!situation.trim()) newErrors.situation = t.requiredSituation;

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    onSave({
      date,
      details: details.trim(),
      score: score === "none" ? null : Number(score),
      place: place.trim(),
      situation: situation.trim(),
      observations: observations.trim(),
    });
  }

  function confirmNewTag() {
    const tag = newTagText.trim();
    if (!tag) return;
    onAddSituationTag?.(tag);
    setSituation(tag);
    setNewTagText("");
    setAddingTag(false);
  }

  function confirmNewPlaceTag() {
    const tag = newPlaceTagText.trim();
    if (!tag) return;
    onAddPlaceTag?.(tag);
    setPlace(tag);
    setNewPlaceTagText("");
    setAddingPlaceTag(false);
  }

  const inputStyle = {
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.inputBg,
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Date */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.eventDate} *</Label>
        <DatePicker
          value={date}
          onChange={setDate}
          placeholder="2026.03.08"
          className="rounded-2xl"
          style={{ ...inputStyle }}
        />
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft }}>
          {t.dateFormatHelper}
        </p>
        {errors.date && (
          <p style={{ ...TEXT.caption, color: "#ef4444" }}>{errors.date}</p>
        )}
      </div>

      {/* Score */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.eventScore}</Label>
        <Select value={score} onValueChange={setScore}>
          <SelectTrigger className="rounded-2xl" style={{ ...inputStyle }}>
            <SelectValue placeholder={t.none} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t.none}</SelectItem>
            {SCORE_OPTIONS.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {renderKisses(value, t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Place */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.eventPlace} *</Label>

        {/* Tag chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", alignItems: "center" }}>
          {placeTags.map((tag) => {
            const selected = place === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setPlace(selected ? "" : tag)}
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  ...TEXT.caption,
                  border: `1px solid ${selected ? PALETTE.accent : PALETTE.inputBorder}`,
                  backgroundColor: selected ? PALETTE.accentMuted : PALETTE.inputBg,
                  color: selected ? PALETTE.accent : PALETTE.textSoft,
                  fontWeight: selected ? "600" : "400",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tag}
              </button>
            );
          })}

          {/* Add tag inline */}
          {addingPlaceTag ? (
            <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", flex: "1 1 10rem" }}>
              <Input
                value={newPlaceTagText}
                onChange={(e) => setNewPlaceTagText(e.target.value)}
                placeholder={t.newTagPlaceholder}
                maxLength={50}
                autoFocus
                className="rounded-2xl"
                style={{ ...inputStyle, ...TEXT.input, height: "1.75rem", flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); confirmNewPlaceTag(); }
                  if (e.key === "Escape") { setAddingPlaceTag(false); setNewPlaceTagText(""); }
                }}
              />
              <Button
                type="button"
                className="rounded-2xl"
                style={{ height: "1.75rem", padding: "0 0.625rem", ...TEXT.caption, background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`, color: "white", border: "none" }}
                onClick={confirmNewPlaceTag}
              >
                {t.addTagConfirm ?? "+"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                style={{ height: "1.75rem", padding: "0 0.625rem", ...TEXT.caption, ...inputStyle }}
                onClick={() => { setAddingPlaceTag(false); setNewPlaceTagText(""); }}
              >
                ✕
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingPlaceTag(true)}
              style={{
                padding: "0.25rem 0.625rem",
                borderRadius: "9999px",
                ...TEXT.caption,
                border: `1px dashed ${PALETTE.inputBorder}`,
                backgroundColor: "transparent",
                color: PALETTE.textSoft,
                cursor: "pointer",
              }}
            >
              + {t.addTag}
            </button>
          )}
        </div>

        <Input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder={t.eventPlacePlaceholder}
          maxLength={200}
          className="rounded-2xl"
          style={{ ...inputStyle, ...TEXT.input }}
        />
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: "right" }}>
          {place.length}/200
        </p>
        {errors.place && (
          <p style={{ ...TEXT.caption, color: "#ef4444" }}>{errors.place}</p>
        )}
      </div>

      {/* Situation */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.eventSituation} *</Label>

        {/* Tag chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", alignItems: "center" }}>
          {situationTags.map((tag) => {
            const selected = situation === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSituation(selected ? "" : tag)}
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  ...TEXT.caption,
                  border: `1px solid ${selected ? PALETTE.accent : PALETTE.inputBorder}`,
                  backgroundColor: selected ? PALETTE.accentMuted : PALETTE.inputBg,
                  color: selected ? PALETTE.accent : PALETTE.textSoft,
                  fontWeight: selected ? "600" : "400",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tag}
              </button>
            );
          })}

          {/* Add tag inline */}
          {addingTag ? (
            <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", flex: "1 1 10rem" }}>
              <Input
                ref={newTagInputRef}
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                placeholder={t.newTagPlaceholder}
                maxLength={50}
                autoFocus
                className="rounded-2xl"
                style={{ ...inputStyle, ...TEXT.input, height: "1.75rem", flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); confirmNewTag(); }
                  if (e.key === "Escape") { setAddingTag(false); setNewTagText(""); }
                }}
              />
              <Button
                type="button"
                className="rounded-2xl"
                style={{ height: "1.75rem", padding: "0 0.625rem", ...TEXT.caption, background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`, color: "white", border: "none" }}
                onClick={confirmNewTag}
              >
                {t.addTagConfirm ?? "+"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                style={{ height: "1.75rem", padding: "0 0.625rem", ...TEXT.caption, ...inputStyle }}
                onClick={() => { setAddingTag(false); setNewTagText(""); }}
              >
                ✕
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingTag(true)}
              style={{
                padding: "0.25rem 0.625rem",
                borderRadius: "9999px",
                ...TEXT.caption,
                border: `1px dashed ${PALETTE.inputBorder}`,
                backgroundColor: "transparent",
                color: PALETTE.textSoft,
                cursor: "pointer",
              }}
            >
              + {t.addTag}
            </button>
          )}
        </div>

        <Input
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder={t.eventSituationPlaceholder}
          maxLength={200}
          className="rounded-2xl"
          style={{ ...inputStyle, ...TEXT.input }}
        />
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: "right" }}>
          {situation.length}/200
        </p>
        {errors.situation && (
          <p style={{ ...TEXT.caption, color: "#ef4444" }}>{errors.situation}</p>
        )}
      </div>

      {/* Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.eventDetails}</Label>
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t.eventDetailsPlaceholder}
          maxLength={1000}
          className="rounded-2xl"
          style={{ ...inputStyle, ...TEXT.input }}
        />
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: "right" }}>
          {details.length}/1000
        </p>
      </div>

      {/* Observations */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.eventObservations}</Label>
        <Textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder={t.eventObservationsPlaceholder}
          maxLength={1000}
          className="rounded-2xl"
          style={{ ...inputStyle, ...TEXT.input }}
        />
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: "right" }}>
          {observations.length}/1000
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            type="submit"
            className="rounded-2xl"
            style={{
              flex: "1 1 0%",
              color: "white",
              boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
              background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
            }}
          >
            {t.saveEvent}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            style={{ ...inputStyle }}
            onClick={onCancel}
          >
            {t.cancel}
          </Button>
        </div>
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl w-full"
                style={{ borderColor: "#ef4444", color: "#ef4444" }}
              >
                {t.deleteEvent}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.deleteEventConfirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{t.deleteEventConfirmDesc}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  style={{ background: "#ef4444", color: "white" }}
                  onClick={onDelete}
                >
                  {t.deleteEventConfirmAction}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  );
}