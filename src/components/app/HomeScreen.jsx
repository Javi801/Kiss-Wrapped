import { useState } from "react";
import {
  BarChart3,
  Check,
  Eye,
  EyeOff,
  Languages,
  Settings,
  Trash2,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { PALETTE } from "@/lib/constants";
import StatTile from "@/components/shared/StatTile";
import ColorSelector from "@/components/app/ColorSelector";

/**
 * Renders the main dashboard screen.
 * It shows summary metrics, primary actions, and app-level settings.
 */
export default function MainScreen({
  onNavigate,
  onClearData,
  people,
  t,
  language,
  setLanguage,
  iconColor,
  setIconColor,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsVisible, setStatsVisible] = useState(true);

  // Count all events across every saved person.
  const totalEvents = people.reduce(
    (sum, person) => sum + (person.events?.length || 0),
    0,
  );

  const frostedButtonStyle = {
    height: "3.5rem",
    width: "3.5rem",
    borderRadius: "9999px",
    padding: "0",
    backgroundColor: "rgba(255,255,255,0.22)",
    border: "1.5px solid rgba(255,255,255,0.45)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
  };

  const buttonLabelStyle = {
    fontSize: "0.625rem",
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    letterSpacing: "0.05em",
    textAlign: "center",
    maxWidth: "5rem",
  };

  const outlineActionStyle = {
    height: "3.5rem",
    justifyContent: "flex-start",
    borderRadius: "1.5rem",
    fontSize: "1rem",
    lineHeight: "1.5rem",
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    borderColor: "#ecd6e0",
    backgroundColor: "rgba(255,255,255,0.86)",
  };

  const languageOptions = [
    { value: "en", label: t.english },
    { value: "es", label: t.spanish },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Hero summary card */}
      <Card
        style={{
          overflow: "hidden",
          borderRadius: "30px",
          border: "none",
          color: "white",
          boxShadow:
            "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
          background: `linear-gradient(135deg, ${PALETTE.rose}, ${PALETTE.roseSoft}, ${PALETTE.sky})`,
        }}
      >
        <CardContent style={{ position: "relative", padding: "1.5rem" }}>
          {/* Decorative blurred circles */}
          <div
            style={{
              position: "absolute",
              right: "-2rem",
              top: "-2rem",
              height: "7rem",
              width: "7rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(255,255,255,0.1)",
              filter: "blur(40px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "-2rem",
              bottom: "0",
              height: "6rem",
              width: "6rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(255,255,255,0.1)",
              filter: "blur(40px)",
            }}
          />

          <h1
            style={{
              fontSize: "1.5rem",
              lineHeight: "2rem",
              fontWeight: "bold",
              letterSpacing: "-0.025em",
            }}
          >
            {t.heroTitle}
          </h1>

          <div
            style={{
              marginTop: "1.25rem",
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "0.75rem",
            }}
          >
            <StatTile
              label={t.peopleSaved}
              value={statsVisible ? people.length : "-"}
              accent={true}
            />
            <StatTile
              label={t.totalEvents}
              value={statsVisible ? totalEvents : "-"}
              accent={true}
            />
          </div>

          {/* App settings — frosted icon buttons floating on the gradient */}
          <div
            style={{
              marginTop: "1.25rem",
              display: "flex",
              justifyContent: "space-around",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
              <Button
                type="button"
                aria-label={t.language}
                style={frostedButtonStyle}
                onClick={() => setLanguageOpen(true)}
              >
                <Languages style={{ height: "1.25rem", width: "1.25rem", color: "white" }} />
              </Button>
              <span style={buttonLabelStyle}>{t.language}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
              <Button
                type="button"
                aria-label={statsVisible ? t.hideStats : t.showStats}
                aria-pressed={!statsVisible}
                style={{
                  ...frostedButtonStyle,
                  backgroundColor: statsVisible
                    ? "rgba(255,255,255,0.22)"
                    : "rgba(255,255,255,0.10)",
                  border: statsVisible
                    ? "1.5px solid rgba(255,255,255,0.45)"
                    : "1.5px solid rgba(255,255,255,0.2)",
                }}
                onClick={() => setStatsVisible((visible) => !visible)}
              >
                {statsVisible ? (
                  <Eye style={{ height: "1.25rem", width: "1.25rem", color: "white" }} />
                ) : (
                  <EyeOff style={{ height: "1.25rem", width: "1.25rem", color: "rgba(255,255,255,0.55)" }} />
                )}
              </Button>
              <span style={buttonLabelStyle}>{t.stats}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
              <Button
                type="button"
                aria-label={t.settings}
                style={frostedButtonStyle}
                onClick={() => setSettingsOpen(true)}
              >
                <Settings style={{ height: "1.25rem", width: "1.25rem", color: "white" }} />
              </Button>
              <span style={buttonLabelStyle}>{t.settings}</span>
            </div>
          </div>

        </CardContent>
      </Card>

      <Dialog open={languageOpen} onOpenChange={setLanguageOpen}>
        <DialogContent>
          <DialogHeader>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  borderRadius: "9999px",
                  background: `linear-gradient(135deg, ${PALETTE.rose}, ${PALETTE.roseSoft})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 4px 14px rgba(226,115,150,0.35)`,
                }}
              >
                <Languages style={{ height: "1.5rem", width: "1.5rem", color: "white" }} />
              </div>
              <DialogTitle style={{ color: PALETTE.deep2, fontSize: "1.125rem", fontWeight: "700" }}>
                {t.language}
              </DialogTitle>
            </div>
          </DialogHeader>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {languageOptions.map((option) => {
              const selected = option.value === language;

              return (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  style={{
                    height: "3.25rem",
                    justifyContent: "space-between",
                    borderRadius: "0.875rem",
                    fontSize: "1rem",
                    fontWeight: selected ? "600" : "400",
                    borderColor: selected ? PALETTE.rose : PALETTE.line,
                    backgroundColor: selected ? "#fff0f5" : "white",
                    color: selected ? PALETTE.rose : PALETTE.text,
                    boxShadow: selected
                      ? "0 2px 8px rgba(226,115,150,0.18)"
                      : "none",
                  }}
                  onClick={() => {
                    setLanguage(option.value);
                    setLanguageOpen(false);
                  }}
                >
                  {option.label}
                  {selected ? (
                    <Check style={{ height: "1.25rem", width: "1.25rem", color: PALETTE.rose }} />
                  ) : null}
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  borderRadius: "9999px",
                  background: `linear-gradient(135deg, ${PALETTE.deep2}, ${PALETTE.lavender})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 4px 14px rgba(60,9,108,0.25)`,
                }}
              >
                <Settings style={{ height: "1.5rem", width: "1.5rem", color: "white" }} />
              </div>
              <DialogTitle style={{ color: PALETTE.deep2, fontSize: "1.125rem", fontWeight: "700" }}>
                {t.settings}
              </DialogTitle>
            </div>
          </DialogHeader>
          <section style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <ColorSelector
              iconColor={iconColor}
              setIconColor={setIconColor}
              t={t}
              accent={false}
            />
          </section>
        </DialogContent>
      </Dialog>

      {/* Main action buttons */}
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <Button
          style={{
            height: "3.5rem",
            justifyContent: "flex-start",
            borderRadius: "1.5rem",
            fontSize: "1rem",
            lineHeight: "1.5rem",
            color: "white",
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            background: `linear-gradient(90deg, ${PALETTE.rose}, ${PALETTE.roseSoft})`,
          }}
          onClick={() => onNavigate("add")}
        >
          <UserPlus style={{ marginRight: "0.75rem", height: "1.25rem", width: "1.25rem" }} />
          {t.addNewPerson}
        </Button>

        <Button
          variant="outline"
          style={outlineActionStyle}
          onClick={() => onNavigate("people")}
        >
          <Users
            style={{ marginRight: "0.75rem", height: "1.25rem", width: "1.25rem", color: PALETTE.rose }}
          />
          {t.viewEditPeople}
        </Button>

        <Button
          variant="outline"
          style={outlineActionStyle}
          onClick={() => onNavigate("stats")}
        >
          <BarChart3
            style={{ marginRight: "0.75rem", height: "1.25rem", width: "1.25rem", color: PALETTE.sky2 }}
          />
          {t.viewStatistics}
        </Button>

        <Button
          variant="outline"
          style={{ ...outlineActionStyle, color: "#dc2626" }}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 style={{ marginRight: "0.75rem", height: "1.25rem", width: "1.25rem" }} />
          {t.clearLocalData}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#dc2626" }}
            >
              <TriangleAlert style={{ height: "1.25rem", width: "1.25rem", flexShrink: 0 }} />
              <DialogTitle style={{ color: "#dc2626" }}>
                {t.clearDataConfirmTitle}
              </DialogTitle>
            </div>
            <DialogDescription>{t.clearDataConfirmDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              className="hover:bg-red-700"
              style={{ backgroundColor: "#dc2626", color: "white" }}
              onClick={() => {
                setConfirmOpen(false);
                onClearData();
              }}
            >
              {t.clearDataConfirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
