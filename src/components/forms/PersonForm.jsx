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

import { GENDERS, ZODIAC_OPTIONS, TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import { translateGender } from "@/lib/format";
import { calculateAge, deriveBirthYear, isWithinZodiacPeriod } from "@/lib/date";

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
  mode,
}) {
  const PALETTE = usePalette();
  // Local form state initialization.
  const [form, setForm] = useState(() => {
    if (!initialValues) {
      return { name: "", age: "", gender: "", howWeMet: "", zodiacSign: "", activity: "", detail: "" };
    }
    const displayAge = initialValues.birthYear
      ? String(calculateAge(initialValues.birthYear, initialValues.zodiacSign) ?? "")
      : String(initialValues.age ?? "");
    return { ...initialValues, age: displayAge };
  });

  const [errors, setErrors] = useState({});
  const [birthdayAlreadyHappened, setBirthdayAlreadyHappened] = useState(false);

  const showBirthdayCheckbox = isWithinZodiacPeriod(form.zodiacSign);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "zodiacSign") setBirthdayAlreadyHappened(false);
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

    const { age, ...rest } = form;
    onSave({
      ...rest,
      birthYear: deriveBirthYear(Number(age), form.zodiacSign, showBirthdayCheckbox && birthdayAlreadyHappened),
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
            maxLength={100}
            className="rounded-2xl"
            style={{ ...inputStyle }}
          />
          <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: "right" }}>
            {form.name.length}/100
          </p>
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
              min={1}
              max={120}
              className="rounded-2xl"
              style={{ ...inputStyle }}
            />
            {errors.age && (
              <p style={{ ...TEXT.caption, color: "#ef4444" }}>{errors.age}</p>
            )}
            {showBirthdayCheckbox && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <p style={{ ...TEXT.caption, color: PALETTE.textSoft }}>{t.birthdayAlreadyHappened}</p>
                <div style={{ display: "flex", borderRadius: "0.75rem", overflow: "hidden", border: `1px solid ${PALETTE.inputBorder}`, width: "fit-content" }}>
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setBirthdayAlreadyHappened(val)}
                      style={{
                        padding: "0.2rem 0.85rem",
                        ...TEXT.caption,
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "none",
                        backgroundColor: birthdayAlreadyHappened === val ? PALETTE.accent : "transparent",
                        color: birthdayAlreadyHappened === val ? "#fff" : PALETTE.textSoft,
                        transition: "background-color 0.15s, color 0.15s",
                      }}
                    >
                      {val ? t.yes : t.no}
                    </button>
                  ))}
                </div>
              </div>
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
              maxLength={200}
              className="rounded-2xl"
            style={{ ...inputStyle }}
            />
            <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: "right" }}>
              {form.howWeMet.length}/200
            </p>
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
              <SelectItem value="studies">{mode === "add" ? t.studiesForm : t.studies}</SelectItem>
              <SelectItem value="works">{mode === "add" ? t.worksForm : t.works}</SelectItem>
              <SelectItem value="studies and works">
                {mode === "add" ? t.studiesWorksForm : t.studiesWorks}
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
              maxLength={500}
              className="rounded-2xl"
              style={{ ...inputStyle, ...TEXT.input }}
            />
            <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: "right" }}>
              {form.detail.length}/500
            </p>
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
            background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
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