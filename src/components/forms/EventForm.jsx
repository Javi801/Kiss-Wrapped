import { useState } from "react";

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

import { PALETTE, SCORE_OPTIONS, TEXT } from "@/lib/constants";
import { todayString, isValidDateString } from "@/lib/date";
import { hasScore, renderKisses } from "@/lib/format";

export default function EventForm({ initialValues, onSave, onCancel, t }) {
  const [date, setDate] = useState(initialValues?.date || todayString());
  const [details, setDetails] = useState(initialValues?.details || "");
  const [score, setScore] = useState(
    hasScore(initialValues?.score) ? String(initialValues.score) : "none",
  );
  const [place, setPlace] = useState(initialValues?.place || "");
  const [situation, setSituation] = useState(initialValues?.situation || "");
  const [observations, setObservations] = useState(initialValues?.observations || "");

  const [errors, setErrors] = useState({});

  function submit(e) {
    e.preventDefault();

    const newErrors = {};
    if (!isValidDateString(date)) newErrors.date = t.validDateMsg;
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
        <Input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder={t.eventPlacePlaceholder}
          className="rounded-2xl"
          style={{ ...inputStyle, ...TEXT.input }}
        />
        {errors.place && (
          <p style={{ ...TEXT.caption, color: "#ef4444" }}>{errors.place}</p>
        )}
      </div>

      {/* Situation */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.eventSituation} *</Label>
        <Input
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder={t.eventSituationPlaceholder}
          className="rounded-2xl"
          style={{ ...inputStyle, ...TEXT.input }}
        />
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
          className="rounded-2xl"
          style={{ ...inputStyle, ...TEXT.input }}
        />
      </div>

      {/* Observations */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.eventObservations}</Label>
        <Textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder={t.eventObservationsPlaceholder}
          className="rounded-2xl"
          style={{ ...inputStyle, ...TEXT.input }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          type="submit"
          className="rounded-2xl"
          style={{
            flex: "1 1 0%",
            color: "white",
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            background: `linear-gradient(90deg, ${PALETTE.rose}, ${PALETTE.roseSoft})`,
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
    </form>
  );
}