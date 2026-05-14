import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { PALETTE } from "@/lib/constants";
import PersonForm from "@/components/forms/PersonForm";

/**
 * Renders the screen used to add a new person.
 * It wraps the shared person form with navigation controls.
 */
export default function AddPersonScreen({ onSave, onBack, t, language }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "0.5rem" }}>
      {/* Back action */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
        <Button
          variant="ghost"
          className="hover:bg-rose-50 rounded-2xl"
          style={{ color: PALETTE.deep }}
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
          boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          backdropFilter: "blur(8px)",
          borderColor: PALETTE.cardBorder,
          backgroundColor: "rgba(255,255,255,0.84)",
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