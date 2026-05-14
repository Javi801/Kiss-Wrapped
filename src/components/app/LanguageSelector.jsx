import { Languages } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PALETTE, TEXT } from "@/lib/constants";

/**
 * Renders an inline language selector designed to scale to more languages.
 * It avoids floating UI to reduce click and layering issues.
 */
export default function LanguageSelector({ language, setLanguage, t }) {
  // Centralize selector styling for consistency with the dashboard actions.
  const triggerStyle = {
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.controlBg,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <p
        style={{ ...TEXT.bodyStrong, textTransform: "uppercase", color: "rgba(255,255,255,0.88)" }}
      >
        {t.language}
      </p>

      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger
          aria-label={t.language}
          className="rounded-3xl"
          style={{ height: "3.5rem", ...TEXT.base, boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", ...triggerStyle }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Languages
              style={{ height: "1.25rem", width: "1.25rem", flexShrink: 0, color: PALETTE.rose }}
            />
            <SelectValue placeholder={t.language} />
          </div>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="en">{t.english}</SelectItem>
          <SelectItem value="es">{t.spanish}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
