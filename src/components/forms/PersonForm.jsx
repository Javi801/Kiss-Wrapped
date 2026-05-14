import { useState } from "react";
import { Save } from "lucide-react";

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

import { GENDERS, ZODIAC_OPTIONS, PALETTE, TEXT } from "@/lib/constants";
import { translateGender } from "@/lib/format";

/**
 * Form used for creating or editing a person.
 * Handles validation and normalization before submit.
 */
export default function PersonForm({
  initialValues,
  onSave,
  onCancel,
  t,
  language,
  includeHowWeMet = true,
  saveLabel,
}) {
  // Local form state initialization.
  const [form, setForm] = useState(
    initialValues || {
      name: "",
      age: "",
      gender: "",
      howWeMet: "",
      zodiacSign: "",
      activity: "",
      detail: "",
    },
  );

  // Validation errors.
  const [errors, setErrors] = useState({});

  // Update a specific field in the form state.
  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Validate required fields and data types.
  function validate() {
    const next = {};

    if (!form.name.trim()) next.name = t.requiredName;

    if (!String(form.age).trim()) next.age = t.requiredAge;
    else if (!Number.isInteger(Number(form.age)) || Number(form.age) <= 0)
      next.age = t.validAge;

    if (!form.gender) next.gender = t.requiredGender;

    if (includeHowWeMet && !form.howWeMet.trim())
      next.howWeMet = t.requiredHowWeMet;

    if (!form.zodiacSign) next.zodiacSign = t.requiredZodiac;

    if (!form.activity) next.activity = t.requiredActivity;

    setErrors(next);

    return Object.keys(next).length === 0;
  }

  // Submit handler that normalizes values before sending.
  function submit(e) {
    e.preventDefault();

    if (!validate()) return;

    onSave({
      ...form,
      age: Number(form.age),
      detail: form.detail.trim(),
      howWeMet: includeHowWeMet
        ? form.howWeMet.trim()
        : initialValues?.howWeMet || "",
      name: form.name.trim(),
    });
  }

  // Shared input styling.
  const inputStyle = {
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.inputBg,
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gap: "1rem" }}>
        {/* Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Label>{t.name} *</Label>
          <Input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="rounded-2xl"
            style={{ ...inputStyle }}
          />
          {errors.name && (
            <p style={{ ...TEXT.caption, color: "#ef4444" }}>{errors.name}</p>
          )}
        </div>

        {/* Age + Gender */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Label>{t.age} *</Label>
            <Input
              type="number"
              value={form.age}
              onChange={(e) => update("age", e.target.value)}
              className="rounded-2xl"
            style={{ ...inputStyle }}
            />
            {errors.age && (
              <p style={{ ...TEXT.caption, color: "#ef4444" }}>{errors.age}</p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Label>{t.gender} *</Label>
            <Select
              value={form.gender}
              onValueChange={(value) => update("gender", value)}
            >
              <SelectTrigger className="rounded-2xl" style={{ ...inputStyle }}>
                <SelectValue placeholder={t.select} />
              </SelectTrigger>

              <SelectContent>
                {GENDERS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {translateGender(item, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.gender && (
              <p style={{ ...TEXT.caption, color: "#ef4444" }}>{errors.gender}</p>
            )}
          </div>
        </div>

        {/* How we met */}
        {includeHowWeMet && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Label>{t.howWeMet} *</Label>
            <Input
              value={form.howWeMet}
              onChange={(e) => update("howWeMet", e.target.value)}
              className="rounded-2xl"
            style={{ ...inputStyle }}
            />
            {errors.howWeMet && (
              <p style={{ ...TEXT.caption, color: "#ef4444" }}>{errors.howWeMet}</p>
            )}
          </div>
        )}

        {/* Zodiac */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Label>{t.zodiacSign} *</Label>
          <Select
            value={form.zodiacSign}
            onValueChange={(value) => update("zodiacSign", value)}
          >
            <SelectTrigger className="rounded-2xl" style={{ ...inputStyle }}>
              <SelectValue placeholder={t.select} />
            </SelectTrigger>

            <SelectContent>
              {ZODIAC_OPTIONS[language].map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {errors.zodiacSign && (
            <p style={{ ...TEXT.caption, color: "#ef4444" }}>{errors.zodiacSign}</p>
          )}
        </div>

        {/* Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Label>{t.activity} *</Label>
          <Select
            value={form.activity}
            onValueChange={(value) => update("activity", value)}
          >
            <SelectTrigger className="rounded-2xl" style={{ ...inputStyle }}>
              <SelectValue placeholder={t.select} />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="studies">{t.studiesForm}</SelectItem>
              <SelectItem value="works">{t.worksForm}</SelectItem>
              <SelectItem value="studies and works">
                {t.studiesWorksForm}
              </SelectItem>
              <SelectItem value="other">{t.other}</SelectItem>
            </SelectContent>
          </Select>

          {errors.activity && (
            <p style={{ ...TEXT.caption, color: "#ef4444" }}>{errors.activity}</p>
          )}
        </div>

        {/* Specific — only visible after an activity is chosen */}
        {form.activity && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Label>{t.detail}</Label>
            <Textarea
              value={form.detail}
              onChange={(e) => update("detail", e.target.value)}
              placeholder={
                form.activity === "studies"
                  ? t.specificStudies
                  : form.activity === "works"
                    ? t.specificWorks
                    : form.activity === "studies and works"
                      ? t.specificStudiesWorks
                      : ""
              }
              className="rounded-2xl"
              style={{ ...inputStyle, ...TEXT.input }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.5rem" }}>
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
          <Save style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }} />
          {saveLabel || t.savePerson}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            style={{ ...inputStyle }}
            onClick={onCancel}
          >
            {t.cancel}
          </Button>
        )}
      </div>
    </form>
  );
}