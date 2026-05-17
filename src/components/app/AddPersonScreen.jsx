import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { usePalette } from "@/lib/theme";
import PersonForm from "@/components/forms/PersonForm";

/**
 * Renders the screen used to add a new person.
 * It wraps the shared person form with navigation controls.
 */
export default function AddPersonScreen({ onSave, onBack, t, language }) {
  const PALETTE = usePalette();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "0.5rem" }}>
      {/* Back action */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
        <Button
          variant="ghost"
          className="rounded-2xl"
          style={{ color: PALETTE.accentEmphasis }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PALETTE.accentMuted)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          onClick={onBack}
        >
          <ArrowLeft style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }} />
          {t.back}
        </Button>
      </div>

      {/* Form container */}
      <Card
        className="rounded-3xl"
        style={{
          boxShadow: `0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px ${PALETTE.cardBorder}`,
          backdropFilter: "blur(12px)",
          border: "none",
          background: `linear-gradient(160deg, ${PALETTE.card} 0%, ${PALETTE.cardSoft} 100%)`,
        }}
      >
        <CardContent style={{ padding: "1.25rem" }}>
          <PersonForm
            onSave={onSave}
            onCancel={onBack}
            t={t}
            language={language}
            includeHowWeMet={false}
            mode="add"
            saveLabel={t.saveAndBack}
          />
        </CardContent>
      </Card>
    </div>
  );
}