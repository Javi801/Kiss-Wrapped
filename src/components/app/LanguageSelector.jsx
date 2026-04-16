import { Languages } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PALETTE } from "@/lib/constants";

/**
 * Renders an inline language selector designed to scale to more languages.
 * It avoids floating UI to reduce click and layering issues.
 */
export default function LanguageSelector({ language, setLanguage, t }) {
  // Centralize selector styling for consistency with the dashboard actions.
  const triggerStyle = {
    borderColor: "#ecd6e0",
    backgroundColor: "rgba(255,255,255,0.86)",
  };

  return (
    <div className="space-y-2">
      <p
        className="text-sm font-medium"
        style={{ color: PALETTE.text }}
      >
        {t.language}
      </p>

      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger
          aria-label={t.language}
          className="h-14 rounded-3xl text-base shadow-sm"
          style={triggerStyle}
        >
          <div className="flex items-center gap-3">
            <Languages
              className="h-5 w-5 shrink-0"
              style={{ color: PALETTE.rose }}
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