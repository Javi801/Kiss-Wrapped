import { useEffect, useRef, useState } from 'react'
import { TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

import { usePalette } from '@/lib/theme'
import { exportPeopleJson } from '@/lib/device-storage'
import { buildImportStatus, skipPartnerIssues, resolvePartnerIssues } from '@/lib/import-people'
import HomeHeroCard from '@/components/app/HomeHeroCard'
import HomeSettingsDialogs from '@/components/app/HomeSettingsDialogs'
import HomeActions from '@/components/app/HomeActions'
import JsonExportDialogs from '@/components/app/JsonExportDialogs'
import ImportDialogs from '@/components/app/ImportDialogs'
import AboutDialog from '@/components/app/AboutDialog'
import AppGuideDialog from '@/components/app/AppGuideDialog'
import OnboardingDoneDialog from '@/components/app/OnboardingDoneDialog'
import { TOUR_TARGETS } from '@/lib/onboarding'

/**
 * Renders the main dashboard screen.
 * It shows summary metrics, primary actions, and app-level settings.
 * `onRestartOnboarding` adds the restart-onboarding action to the settings.
 * `onboardingDoneOpen` shows the notice that follows the onboarding; `onCloseOnboardingDone` closes it.
 * For the onboarding tour, `tourTarget` names what it points at (`SCREENS.add`, `SCREENS.people`,
 * `TOUR_TARGETS.data` or `TOUR_TARGETS.settings`) and `tourHint` (`{ title, body }`) is the
 * text for the last two.
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
  includePartnerEvents,
  modalBackRef,
  onRestartOnboarding,
  onboardingDoneOpen = false,
  onCloseOnboardingDone,
  tourTarget,
  tourHint,
}) {
  const PALETTE = usePalette()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  // null = idle | { fileName, isNative, hadMissingFields } = success | Error = failed
  const [jsonExportStatus, setJsonExportStatus] = useState(null)
  // null = idle | { type: "confirm", count, data } | { type: "success", count } | { type: "error_type" | "error_format" }
  // "partner_issues" (notice) and "partner_resolve" (fix table) also carry `rows`: one per person in
  // `data` with invalid partner data, holding its index in `data`, the edited fields and `discarded`.
  const [importStatus, setImportStatus] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!modalBackRef) return
    const anyOpen =
      onboardingDoneOpen ||
      aboutOpen ||
      guideOpen ||
      languageOpen ||
      settingsOpen ||
      confirmOpen ||
      jsonExportStatus !== null ||
      importStatus !== null
    modalBackRef.current = anyOpen
      ? () => {
          if (onboardingDoneOpen) onCloseOnboardingDone()
          else if (aboutOpen) setAboutOpen(false)
          else if (guideOpen) setGuideOpen(false)
          else if (languageOpen) setLanguageOpen(false)
          else if (settingsOpen) setSettingsOpen(false)
          else if (confirmOpen) setConfirmOpen(false)
          else if (jsonExportStatus !== null) setJsonExportStatus(null)
          else if (importStatus?.type === 'partner_resolve')
            setImportStatus((prev) => ({ ...prev, type: 'partner_issues' }))
          else if (importStatus !== null) setImportStatus(null)
        }
      : null
  }, [
    onboardingDoneOpen,
    onCloseOnboardingDone,
    aboutOpen,
    guideOpen,
    languageOpen,
    settingsOpen,
    confirmOpen,
    jsonExportStatus,
    importStatus,
    modalBackRef,
  ])

  async function handleExportJson() {
    try {
      const result = await exportPeopleJson(people)
      setJsonExportStatus(result)
    } catch (err) {
      setJsonExportStatus(err instanceof Error ? err : new Error(String(err)))
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.json')) {
      setImportStatus({ type: 'error_type' })
      return
    }

    try {
      const text = await file.text()
      setImportStatus(buildImportStatus(JSON.parse(text), people))
    } catch {
      setImportStatus({ type: 'error_format' })
    }
  }

  // Returns from the fix table to the notice, keeping the edited rows.
  function backToPartnerIssues() {
    setImportStatus((prev) => ({ ...prev, type: 'partner_issues' }))
  }

  function updateImportRow(index, patch) {
    setImportStatus((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => (row.index === index ? { ...row, ...patch } : row)),
    }))
  }

  function confirmImport() {
    onImportData(importStatus.data)
    setImportStatus({ type: 'success', newCount: importStatus.newCount })
  }

  // Imports only the people without partner issues.
  function importSkippingPartnerIssues() {
    const { people: valid, status } = skipPartnerIssues(importStatus)
    onImportData(valid)
    setImportStatus(status)
  }

  // Imports the valid people plus the fixed rows, in file order; discarded rows are dropped.
  function importResolvedPartnerIssues() {
    const { people: resolved, status } = resolvePartnerIssues(importStatus)
    onImportData(resolved)
    setImportStatus(status)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {/* Hero summary card */}
      <HomeHeroCard
        people={people}
        t={t}
        statsVisible={statsVisible}
        setStatsVisible={setStatsVisible}
        includePartnerEvents={includePartnerEvents}
        onOpenLanguage={() => setLanguageOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        settingsHint={tourTarget === TOUR_TARGETS.settings ? tourHint : undefined}
      />

      <HomeSettingsDialogs
        t={t}
        language={language}
        setLanguage={setLanguage}
        iconColor={iconColor}
        setIconColor={setIconColor}
        theme={theme}
        setTheme={setTheme}
        languageOpen={languageOpen}
        setLanguageOpen={setLanguageOpen}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        onOpenAbout={() => setAboutOpen(true)}
        onOpenGuide={() => setGuideOpen(true)}
        onRestartOnboarding={onRestartOnboarding}
      />

      {/* Main action buttons */}
      <HomeActions
        t={t}
        onNavigate={onNavigate}
        onExportJson={handleExportJson}
        onImportJson={() => fileInputRef.current?.click()}
        onClearData={() => setConfirmOpen(true)}
        tourTarget={tourTarget}
        dataHint={tourTarget === TOUR_TARGETS.data ? tourHint : undefined}
      />

      <JsonExportDialogs
        status={jsonExportStatus}
        t={t}
        onClose={() => setJsonExportStatus(null)}
      />

      <ImportDialogs
        importStatus={importStatus}
        t={t}
        onClose={() => setImportStatus(null)}
        onConfirm={confirmImport}
        onFix={() => setImportStatus((prev) => ({ ...prev, type: 'partner_resolve' }))}
        onSkip={importSkippingPartnerIssues}
        onBack={backToPartnerIssues}
        onRowChange={updateImportRow}
        onImport={importResolvedPartnerIssues}
      />

      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} t={t} />

      <AppGuideDialog open={guideOpen} onOpenChange={setGuideOpen} t={t} />

      <OnboardingDoneDialog open={onboardingDoneOpen} onClose={onCloseOnboardingDone} t={t} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: PALETTE.dangerEmphasis,
              }}
            >
              <TriangleAlert style={{ height: '1.25rem', width: '1.25rem', flexShrink: 0 }} />
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
                setConfirmOpen(false)
                onClearData()
              }}
            >
              {t.clearDataConfirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
