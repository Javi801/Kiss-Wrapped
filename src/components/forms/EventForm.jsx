import { useState } from "react";

import { Button } from "@/components/ui/button";
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

/**
 * Form used to create or edit an event.
 * Handles validation and normalization of date and score.
 */
export default function EventForm({ initialValues, onSave, onCancel, t }) {
  // Initialize form state with defaults or existing values.
  const [date, setDate] = useState(
    initialValues?.date || todayString(),
  );
  const [details, setDetails] = useState(
    initialValues?.details || "",
  );
  const [score, setScore] = useState(
    hasScore(initialValues?.score)
      ? String(initialValues.score)
      : "none",
  );

  // Validation error state.
  const [error, setError] = useState("");

  // Validate and submit event data.
  function submit(e) {
    e.preventDefault();

    // Validate date format.
    if (!isValidDateString(date)) {
      setError(t.validDateMsg);
      return;
    }

    setError("");

    // Normalize values before sending.
    onSave({
      date,
      details: details.trim(),
      score: score === "none" ? null : Number(score),
    });
  }

  // Shared input styling.
  const inputStyle = {
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.inputBg,
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Date */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.eventDate} *</Label>
        <Input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="2026.03.08"
          className="rounded-2xl"
          style={{ ...inputStyle }}
        />

        {/* Helper text */}
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft }}>
          {t.dateFormatHelper}
        </p>

        {/* Error message */}
        {error && (
          <p style={{ ...TEXT.caption, color: "#ef4444" }}>{error}</p>
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

      {/* Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.eventDetails}</Label>
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t.eventDetailsPlaceholder}
          className="rounded-2xl"
          style={{ ...inputStyle }}
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