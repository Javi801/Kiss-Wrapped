import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  Languages,
  Settings,
  Trash2,
  TriangleAlert,
  Upload,
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

import { TEXT, APP_VERSION, APP_GITHUB_USER, APP_GITHUB_REPO } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import { exportPeopleJson } from "@/lib/device-storage";
import { saveErrorLog } from "@/lib/pdf-export";
import StatTile from "@/components/shared/StatTile";
import ColorSelector from "@/components/app/ColorSelector";

/**
 * Renders the main dashboard screen.
 * It shows summary metrics, primary actions, and app-level settings.
 */
export default function MainScreen({
  onNavigate,
  onClearData,
  onImportData,
  people,
  t,
  language,
  setLanguage,
  iconColor,
  setIconColor,
  theme,
  setTheme,
  statsVisible,
  setStatsVisible,
  modalBackRef,
}) {
  const PALETTE = usePalette();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  // null = idle | { fileName, isNative, hadMissingFields } = success | Error = failed
  const [jsonExportStatus, setJsonExportStatus] = useState(null);
  // null = idle | { type: "confirm", count, data } | { type: "success", count } | { type: "error_type" | "error_format" }
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!modalBackRef) return;
    const anyOpen =
      tutorialOpen || languageOpen || settingsOpen || confirmOpen ||
      jsonExportStatus !== null || importStatus !== null;
    modalBackRef.current = anyOpen
      ? () => {
          if (tutorialOpen) setTutorialOpen(false);
          else if (languageOpen) setLanguageOpen(false);
          else if (settingsOpen) setSettingsOpen(false);
          else if (confirmOpen) setConfirmOpen(false);
          else if (jsonExportStatus !== null) setJsonExportStatus(null);
          else if (importStatus !== null) setImportStatus(null);
        }
      : null;
  }, [tutorialOpen, languageOpen, settingsOpen, confirmOpen, jsonExportStatus, importStatus, modalBackRef]);

  async function handleExportJson() {
    try {
      const result = await exportPeopleJson(people);
      setJsonExportStatus(result);
    } catch (err) {
      setJsonExportStatus(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      setImportStatus({ type: "error_type" });
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (
        !Array.isArray(parsed) ||
        !parsed.every((item) => item && typeof item === "object" && !Array.isArray(item))
      ) {
        setImportStatus({ type: "error_format" });
        return;
      }

      const existingIds = new Set(people.map((p) => p.id));
      const newPeople = parsed.filter((p) => !existingIds.has(p.id));
      const skippedCount = parsed.length - newPeople.length;

      if (newPeople.length === 0) {
        setImportStatus({ type: "empty", totalInFile: parsed.length });
        return;
      }

      setImportStatus({ type: "confirm", totalInFile: parsed.length, newCount: newPeople.length, skippedCount, data: newPeople });
    } catch {
      setImportStatus({ type: "error_format" });
    }
  }

  // Count all events across every saved person.
  const totalEvents = people.reduce(
    (sum, person) => sum + (person.events?.length || 0),
    0,
  );

  const frostedButtonStyle = {
    height: "3.5rem",
    width: "3.5rem",
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
    ...TEXT.body,
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.controlBg,
  };

  const dataButtonStyle = {
    height: "4rem",
    flexDirection: "column",
    gap: "0.25rem",
    padding: "0.5rem",
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.controlBg,
  };

  const dataButtonLabelStyle = {
    fontSize: "0.625rem",
    fontWeight: "600",
    letterSpacing: "0.04em",
    lineHeight: "1",
  };

  const languageOptions = [
    { value: "en", label: t.english },
    { value: "es", label: t.spanish },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {/* Hero summary card */}
      <Card
        style={{
          overflow: "hidden",
          borderRadius: "30px",
          border: "none",
          color: PALETTE.textOnAccent,
          boxShadow:
            "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
          background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.accentSoft}, ${PALETTE.gradientEnd})`,
        }}
      >
        <CardContent style={{ position: "relative", padding: "1.5rem" }}>
          {/* Decorative blurred circles */}
          <div
            className="rounded-full"
            style={{
              position: "absolute",
              right: "-2rem",
              top: "-2rem",
              height: "7rem",
              width: "7rem",
              backgroundColor: "rgba(255,255,255,0.1)",
              filter: "blur(40px)",
            }}
          />
          <div
            className="rounded-full"
            style={{
              position: "absolute",
              left: "-2rem",
              bottom: "0",
              height: "6rem",
              width: "6rem",
              backgroundColor: "rgba(255,255,255,0.1)",
              filter: "blur(40px)",
            }}
          />

          <h1
            style={{
              ...TEXT.heading,
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

          {/* App settings shown as frosted icon buttons on the gradient. */}
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
                className="rounded-full"
                style={frostedButtonStyle}
                onClick={() => setLanguageOpen(true)}
              >
                <Languages style={{ height: "1.25rem", width: "1.25rem", color: PALETTE.textOnAccent }} />
              </Button>
              <span style={buttonLabelStyle}>{t.language}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
              <Button
                type="button"
                aria-label={statsVisible ? t.hideStats : t.showStats}
                aria-pressed={!statsVisible}
                className="rounded-full"
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
                  <Eye style={{ height: "1.25rem", width: "1.25rem", color: PALETTE.textOnAccent }} />
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
                className="rounded-full"
                style={frostedButtonStyle}
                onClick={() => setSettingsOpen(true)}
              >
                <Settings style={{ height: "1.25rem", width: "1.25rem", color: PALETTE.textOnAccent }} />
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
                className="rounded-full"
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 4px 14px ${PALETTE.accentGlow}`,
                }}
              >
                <Languages style={{ height: "1.5rem", width: "1.5rem", color: PALETTE.textOnAccent }} />
              </div>
              <DialogTitle style={{ ...TEXT.subheading, color: PALETTE.accentEmphasis2 }}>
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
                  className="rounded-xl"
                  style={{
                    height: "3.25rem",
                    justifyContent: "space-between",
                    ...TEXT.base,
                    fontWeight: selected ? "600" : "400",
                    borderColor: selected ? PALETTE.accent : PALETTE.line,
                    backgroundColor: selected ? PALETTE.accentMuted : PALETTE.card,
                    color: selected ? PALETTE.accent : PALETTE.text,
                    boxShadow: selected
                      ? `0 2px 8px ${PALETTE.accentShadow}`
                      : "none",
                  }}
                  onClick={() => {
                    setLanguage(option.value);
                    setLanguageOpen(false);
                  }}
                >
                  {option.label}
                  {selected ? (
                    <Check style={{ height: "1.25rem", width: "1.25rem", color: PALETTE.accent }} />
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
                className="rounded-full"
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  background: `linear-gradient(135deg, ${PALETTE.accentEmphasis2}, ${PALETTE.emphasisEnd})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 4px 14px rgba(60,9,108,0.25)`,
                }}
              >
                <Settings style={{ height: "1.5rem", width: "1.5rem", color: PALETTE.textOnAccent }} />
              </div>
              <DialogTitle style={{ ...TEXT.subheading, color: PALETTE.accentEmphasis2 }}>
                {t.settings}
              </DialogTitle>
            </div>
          </DialogHeader>
          <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <ColorSelector
              iconColor={iconColor}
              setIconColor={setIconColor}
              theme={theme}
              setTheme={setTheme}
              t={t}
              accent={false}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              style={{
                height: "3rem",
                justifyContent: "flex-start",
                ...TEXT.body,
                borderColor: PALETTE.inputBorder,
                backgroundColor: PALETTE.controlBg,
                color: PALETTE.text,
              }}
              onClick={() => {
                setSettingsOpen(false);
                setAboutOpen(true);
              }}
            >
              <Info style={{ marginRight: "0.75rem", height: "1rem", width: "1rem", color: PALETTE.accent }} />
              {t.about}
            </Button>
          </section>
        </DialogContent>
      </Dialog>

      {/* Main action buttons */}
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <Button
          className="rounded-3xl"
          style={{
            height: "3.5rem",
            justifyContent: "flex-start",
            ...TEXT.body,
            color: PALETTE.textOnAccent,
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
          }}
          onClick={() => onNavigate("add")}
        >
          <UserPlus style={{ marginRight: "0.75rem", height: "1.25rem", width: "1.25rem" }} />
          {t.addNewPerson}
        </Button>

        <Button
          variant="outline"
          className="rounded-3xl"
          style={outlineActionStyle}
          onClick={() => onNavigate("people")}
        >
          <Users
            style={{ marginRight: "0.75rem", height: "1.25rem", width: "1.25rem", color: PALETTE.accent }}
          />
          {t.viewEditPeople}
        </Button>

        <Button
          variant="outline"
          className="rounded-3xl"
          style={outlineActionStyle}
          onClick={() => onNavigate("stats")}
        >
          <BarChart3
            style={{ marginRight: "0.75rem", height: "1.25rem", width: "1.25rem", color: PALETTE.accent2 }}
          />
          {t.viewStatistics}
        </Button>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", paddingTop: "0.25rem" }}>
          <div style={{ height: "1px", backgroundColor: PALETTE.inputBorder }} />
          <span style={{ ...TEXT.label, color: PALETTE.textSoft, paddingLeft: "0.25rem" }}>
            {t.dataSection}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
          <Button
            variant="outline"
            className="rounded-2xl"
            style={dataButtonStyle}
            onClick={handleExportJson}
          >
            <Upload style={{ height: "1.25rem", width: "1.25rem", color: PALETTE.accent2 }} />
            <span style={dataButtonLabelStyle}>{t.exportJsonLabel}</span>
          </Button>

          <Button
            variant="outline"
            className="rounded-2xl"
            style={dataButtonStyle}
            onClick={() => fileInputRef.current?.click()}
          >
            <Download style={{ height: "1.25rem", width: "1.25rem", color: PALETTE.accent2 }} />
            <span style={dataButtonLabelStyle}>{t.importJsonLabel}</span>
          </Button>

          <Button
            variant="outline"
            className="rounded-2xl"
            style={{ ...dataButtonStyle, color: PALETTE.dangerEmphasis }}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 style={{ height: "1.25rem", width: "1.25rem" }} />
            <span style={dataButtonLabelStyle}>{t.clearLocalDataLabel}</span>
          </Button>
        </div>
      </div>

      {/* JSON export success dialog */}
      <Dialog
        open={jsonExportStatus !== null && !(jsonExportStatus instanceof Error)}
        onOpenChange={(open) => { if (!open) setJsonExportStatus(null); }}
      >
        <DialogContent
          showCloseButton={false}
          className="rounded-2xl"
          style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}
        >
          <DialogHeader>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: jsonExportStatus?.hadMissingFields ? PALETTE.warningBadgeText : PALETTE.accent,
              }}
            >
              {jsonExportStatus?.hadMissingFields ? (
                <TriangleAlert style={{ height: "1.25rem", width: "1.25rem", flexShrink: 0 }} />
              ) : (
                <CheckCircle2 style={{ height: "1.25rem", width: "1.25rem", flexShrink: 0 }} />
              )}
              <DialogTitle
                style={{ color: jsonExportStatus?.hadMissingFields ? PALETTE.warningBadgeText : PALETTE.accent }}
              >
                {jsonExportStatus?.hadMissingFields
                  ? t.exportJsonSuccessWithWarningsTitle
                  : t.exportJsonSuccessTitle}
              </DialogTitle>
            </div>
            <DialogDescription asChild>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: PALETTE.textSoft }}>
                {jsonExportStatus?.hadMissingFields && (
                  <span>{t.exportJsonSuccessWithWarningsDesc}</span>
                )}
                <span>
                  {t.exportJsonSavedAs}:{" "}
                  <strong style={{ color: PALETTE.text, fontFamily: "monospace" }}>
                    {jsonExportStatus?.fileName}
                  </strong>
                </span>
                <span>
                  {jsonExportStatus?.isNative
                    ? t.exportJsonLocationNative
                    : t.exportJsonLocationWeb}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="rounded-xl"
              style={{ background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`, color: PALETTE.textOnAccent, border: "none" }}
              onClick={() => setJsonExportStatus(null)}
            >
              {t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* JSON export error dialog */}
      <Dialog
        open={jsonExportStatus instanceof Error}
        onOpenChange={(open) => { if (!open) setJsonExportStatus(null); }}
      >
        <DialogContent
          showCloseButton={false}
          className="rounded-2xl"
          style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}
        >
          <DialogHeader>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: PALETTE.accentEmphasis }}>
              <TriangleAlert style={{ height: "1.25rem", width: "1.25rem", flexShrink: 0 }} />
              <DialogTitle style={{ color: PALETTE.accentEmphasis }}>{t.exportJsonErrorTitle}</DialogTitle>
            </div>
            <DialogDescription asChild>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: PALETTE.textSoft }}>
                <span>{jsonExportStatus?.message || t.exportJsonErrorDesc}</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              style={{ borderColor: PALETTE.line, color: PALETTE.text }}
              onClick={() => setJsonExportStatus(null)}
            >
              {t.close}
            </Button>
            <Button
              className="rounded-xl"
              style={{ background: PALETTE.accentEmphasis, color: PALETTE.textOnAccent, border: "none" }}
              onClick={() => {
                saveErrorLog(jsonExportStatus).catch(console.error);
                setJsonExportStatus(null);
              }}
            >
              {t.saveJsonErrorLog}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import confirm dialog */}
      <Dialog
        open={importStatus?.type === "confirm"}
        onOpenChange={(open) => { if (!open) setImportStatus(null); }}
      >
        <DialogContent showCloseButton={false} className="rounded-2xl" style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}>
          <DialogHeader>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: PALETTE.accentEmphasis2 }}>
              <Upload style={{ height: "1.25rem", width: "1.25rem", flexShrink: 0 }} />
              <DialogTitle style={{ color: PALETTE.accentEmphasis2 }}>{t.importJsonConfirmTitle}</DialogTitle>
            </div>
            <DialogDescription asChild>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: PALETTE.textSoft }}>
                <span>
                  <strong style={{ color: PALETTE.text }}>{importStatus?.totalInFile}</strong>{" "}
                  {t.importJsonConfirmPeople}
                </span>
                <span>
                  <strong style={{ color: PALETTE.text }}>{importStatus?.newCount}</strong>{" "}
                  {t.importJsonConfirmNew}
                </span>
                {importStatus?.skippedCount > 0 && (
                  <span>
                    <strong style={{ color: PALETTE.text }}>{importStatus?.skippedCount}</strong>{" "}
                    {t.importJsonConfirmSkipped}
                  </span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" style={{ borderColor: PALETTE.line, color: PALETTE.text }} onClick={() => setImportStatus(null)}>
              {t.cancel}
            </Button>
            <Button
              className="rounded-xl"
              style={{ background: `linear-gradient(90deg, ${PALETTE.accentEmphasis2}, ${PALETTE.emphasisEnd})`, color: PALETTE.textOnAccent, border: "none" }}
              onClick={() => {
                onImportData(importStatus.data);
                setImportStatus({ type: "success", newCount: importStatus.newCount });
              }}
            >
              {t.importJsonConfirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import success dialog */}
      <Dialog
        open={importStatus?.type === "success"}
        onOpenChange={(open) => { if (!open) setImportStatus(null); }}
      >
        <DialogContent showCloseButton={false} className="rounded-2xl" style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}>
          <DialogHeader>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: PALETTE.accent }}>
              <CheckCircle2 style={{ height: "1.25rem", width: "1.25rem", flexShrink: 0 }} />
              <DialogTitle style={{ color: PALETTE.accent }}>{t.importJsonSuccessTitle}</DialogTitle>
            </div>
            <DialogDescription asChild>
              <div style={{ color: PALETTE.textSoft }}>
                <strong style={{ color: PALETTE.text }}>{importStatus?.newCount}</strong>{" "}
                {t.importJsonSuccessDesc}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="rounded-xl" style={{ background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`, color: PALETTE.textOnAccent, border: "none" }} onClick={() => setImportStatus(null)}>
              {t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import empty dialog (all people already exist) */}
      <Dialog
        open={importStatus?.type === "empty"}
        onOpenChange={(open) => { if (!open) setImportStatus(null); }}
      >
        <DialogContent showCloseButton={false} className="rounded-2xl" style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}>
          <DialogHeader>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: PALETTE.textSoft }}>
              <Upload style={{ height: "1.25rem", width: "1.25rem", flexShrink: 0 }} />
              <DialogTitle style={{ color: PALETTE.text }}>{t.importJsonEmptyTitle}</DialogTitle>
            </div>
            <DialogDescription style={{ color: PALETTE.textSoft }}>{t.importJsonEmptyDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="rounded-xl" style={{ background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`, color: PALETTE.textOnAccent, border: "none" }} onClick={() => setImportStatus(null)}>
              {t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import error dialog (invalid type or invalid format) */}
      <Dialog
        open={importStatus?.type === "error_type" || importStatus?.type === "error_format"}
        onOpenChange={(open) => { if (!open) setImportStatus(null); }}
      >
        <DialogContent showCloseButton={false} className="rounded-2xl" style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}>
          <DialogHeader>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: PALETTE.accentEmphasis }}>
              <TriangleAlert style={{ height: "1.25rem", width: "1.25rem", flexShrink: 0 }} />
              <DialogTitle style={{ color: PALETTE.accentEmphasis }}>
                {importStatus?.type === "error_type" ? t.importJsonErrorTypeTitle : t.importJsonErrorFormatTitle}
              </DialogTitle>
            </div>
            <DialogDescription style={{ color: PALETTE.textSoft }}>
              {importStatus?.type === "error_type" ? t.importJsonErrorTypeDesc : t.importJsonErrorFormatDesc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="rounded-xl" style={{ background: PALETTE.accentEmphasis, color: PALETTE.textOnAccent, border: "none" }} onClick={() => setImportStatus(null)}>
              {t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* About dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent
          showCloseButton={false}
          className="rounded-2xl"
          style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}
        >
          <DialogHeader>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <div
                className="rounded-full"
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 4px 14px ${PALETTE.accentGlow}`,
                }}
              >
                <Info style={{ height: "1.5rem", width: "1.5rem", color: "white" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <DialogTitle style={{ ...TEXT.subheading, color: PALETTE.accentEmphasis2 }}>
                  {t.appTitle}
                </DialogTitle>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "0.25rem",
                    padding: "0.125rem 0.625rem",
                    borderRadius: "9999px",
                    backgroundColor: PALETTE.accentMuted,
                    color: PALETTE.accent,
                    ...TEXT.caption,
                    fontWeight: "600",
                  }}
                >
                  {t.aboutVersion} {APP_VERSION}
                </span>
              </div>
            </div>
          </DialogHeader>

          <DialogDescription asChild>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: "center", lineHeight: "1.5" }}>
                {t.aboutDescription}
              </p>

              <div style={{ height: "1px", backgroundColor: PALETTE.line }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <span style={{ ...TEXT.label, color: PALETTE.textSoft }}>{t.aboutFeedback}</span>
                <p style={{ ...TEXT.caption, color: PALETTE.textSoft }}>{t.aboutFeedbackDesc}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  style={{
                    height: "2.75rem",
                    justifyContent: "flex-start",
                    ...TEXT.caption,
                    borderColor: PALETTE.inputBorder,
                    backgroundColor: PALETTE.controlBg,
                    color: PALETTE.text,
                  }}
                  onClick={() => window.open(APP_GITHUB_REPO, "_blank")}
                >
                  <ExternalLink style={{ marginRight: "0.75rem", height: "1rem", width: "1rem", color: PALETTE.accent }} />
                  {APP_GITHUB_USER}
                </Button>
              </div>
            </div>
          </DialogDescription>

          <DialogFooter>
            <Button
              className="rounded-xl"
              style={{ background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`, color: "white", border: "none" }}
              onClick={() => setAboutOpen(false)}
            >
              {t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* About dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent
          showCloseButton={false}
          className="rounded-2xl"
          style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}
        >
          <DialogHeader>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <div
                className="rounded-full"
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 4px 14px ${PALETTE.accentGlow}`,
                }}
              >
                <Info style={{ height: "1.5rem", width: "1.5rem", color: "white" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <DialogTitle style={{ ...TEXT.subheading, color: PALETTE.accentEmphasis2 }}>
                  {t.appTitle}
                </DialogTitle>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "0.25rem",
                    padding: "0.125rem 0.625rem",
                    borderRadius: "9999px",
                    backgroundColor: PALETTE.accentMuted,
                    color: PALETTE.accent,
                    ...TEXT.caption,
                    fontWeight: "600",
                  }}
                >
                  {t.aboutVersion} {APP_VERSION}
                </span>
              </div>
            </div>
          </DialogHeader>

          <DialogDescription asChild>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: "center", lineHeight: "1.5" }}>
                {t.aboutDescription}
              </p>

              <div style={{ height: "1px", backgroundColor: PALETTE.line }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <span style={{ ...TEXT.label, color: PALETTE.textSoft }}>{t.aboutFeedback}</span>
                <p style={{ ...TEXT.caption, color: PALETTE.textSoft }}>{t.aboutFeedbackDesc}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  style={{
                    height: "2.75rem",
                    justifyContent: "flex-start",
                    ...TEXT.caption,
                    borderColor: PALETTE.inputBorder,
                    backgroundColor: PALETTE.controlBg,
                    color: PALETTE.text,
                  }}
                  onClick={() => {
                    window.open(APP_GITHUB_REPO, "_blank");
                  }}
                >
                  <ExternalLink style={{ marginRight: "0.75rem", height: "1rem", width: "1rem", color: PALETTE.accent }} />
                  {APP_GITHUB_USER}
                </Button>
              </div>
            </div>
          </DialogDescription>

          <DialogFooter>
            <Button
              className="rounded-xl"
              style={{ background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`, color: "white", border: "none" }}
              onClick={() => setAboutOpen(false)}
            >
              {t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: PALETTE.dangerEmphasis }}
            >
              <TriangleAlert style={{ height: "1.25rem", width: "1.25rem", flexShrink: 0 }} />
              <DialogTitle style={{ color: PALETTE.dangerEmphasis }}>
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
              style={{ backgroundColor: PALETTE.dangerEmphasis, color: PALETTE.textOnAccent }}
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
