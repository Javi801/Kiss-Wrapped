import { TriangleAlert, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import PartnerFields from '@/components/forms/PartnerFields'

import { TEXT } from '@/lib/constants'
import { translatePartnerError } from '@/lib/format'
import { validatePartnerFields } from '@/lib/partner'
import { usePalette } from '@/lib/theme'

const ROW_COLUMNS = 'sm:grid-cols-[minmax(0,1fr)_4rem_minmax(0,2.5fr)_5.5rem]'

/**
 * Import dialogs for people with invalid partner data: the notice that offers to
 * fix or skip them, and the table where each one is fixed or discarded.
 * The state lives in the parent's `importStatus` so the edits survive going back.
 */
export default function ImportPartnerDialogs({
  importStatus,
  t,
  onCancel,
  onFix,
  onSkip,
  onBack,
  onRowChange,
  onImport,
}) {
  const PALETTE = usePalette()

  const data = importStatus?.data ?? []
  const rows = importStatus?.rows ?? []
  const validCount = data.length - rows.length

  const rowErrors = rows.map((row) => (row.discarded ? {} : validatePartnerFields(row)))
  const unresolvedCount = rowErrors.filter((errors) => Object.keys(errors).length > 0).length
  const discardCount = rows.filter((row) => row.discarded).length
  const importCount = data.length - discardCount

  const primaryStyle = {
    background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
    color: PALETTE.textOnAccent,
    border: 'none',
  }
  const outlineStyle = { borderColor: PALETTE.line, color: PALETTE.text }
  const count = (value) => <strong style={{ color: PALETTE.text }}>{value}</strong>

  return (
    <>
      {/* Partner issues notice */}
      <Dialog
        open={importStatus?.type === 'partner_issues'}
        onOpenChange={(open) => {
          if (!open) onCancel()
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="rounded-2xl"
          style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}
        >
          <DialogHeader>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: PALETTE.accentEmphasis2,
              }}
            >
              <TriangleAlert style={{ height: '1.25rem', width: '1.25rem', flexShrink: 0 }} />
              <DialogTitle style={{ color: PALETTE.accentEmphasis2 }}>
                {t.importPartnerIssuesTitle}
              </DialogTitle>
            </div>
            <DialogDescription asChild>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  color: PALETTE.textSoft,
                }}
              >
                <span>
                  {count(importStatus?.totalInFile)} {t.importJsonConfirmPeople}
                </span>
                <span>
                  {count(importStatus?.newCount)} {t.importJsonConfirmNew}
                </span>
                {importStatus?.skippedCount > 0 && (
                  <span>
                    {count(importStatus?.skippedCount)} {t.importJsonConfirmSkipped}
                  </span>
                )}
                <span>
                  {count(rows.length)} {t.importPartnerIssuesCount}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              style={outlineStyle}
              onClick={onCancel}
            >
              {t.cancel}
            </Button>
            {validCount > 0 && (
              <Button
                variant="outline"
                className="rounded-xl"
                style={outlineStyle}
                onClick={onSkip}
              >
                {t.importJsonConfirmAction} {validCount} {t.importPartnerSkipAction} {rows.length}
              </Button>
            )}
            <Button className="rounded-xl" style={primaryStyle} onClick={onFix}>
              {t.importPartnerFix}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partner fix table */}
      <Dialog
        open={importStatus?.type === 'partner_resolve'}
        onOpenChange={(open) => {
          if (!open) onBack()
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="rounded-2xl sm:max-w-3xl"
          style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}
        >
          <DialogHeader>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: PALETTE.accentEmphasis2,
              }}
            >
              <Upload style={{ height: '1.25rem', width: '1.25rem', flexShrink: 0 }} />
              <DialogTitle style={{ color: PALETTE.accentEmphasis2 }}>
                {t.importPartnerIssuesTitle}
              </DialogTitle>
            </div>
            <DialogDescription style={{ color: PALETTE.textSoft }}>
              {count(rows.length)} {t.importPartnerIssuesCount}
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div
              className={`hidden gap-3 sm:grid ${ROW_COLUMNS}`}
              style={{ ...TEXT.caption, fontWeight: 600, color: PALETTE.textSoft }}
            >
              <span>{t.name}</span>
              <span>{t.importPartnerEventsHeader}</span>
              <span>{t.partnerLabel}</span>
              <span>{t.importPartnerDiscard}</span>
            </div>

            {rows.map((row, position) => {
              const person = data[row.index] ?? {}
              const eventCount = Array.isArray(person.events) ? person.events.length : 0
              const errors = Object.fromEntries(
                Object.entries(rowErrors[position]).map(([field, code]) => [
                  field,
                  translatePartnerError(code, t),
                ])
              )
              return (
                <div
                  key={row.index}
                  data-import-row
                  className={`grid grid-cols-1 gap-3 rounded-xl border p-3 sm:items-start ${ROW_COLUMNS}`}
                  style={{ borderColor: PALETTE.line, color: PALETTE.text }}
                >
                  <span style={{ fontWeight: 600, opacity: row.discarded ? 0.5 : 1 }}>
                    {typeof person.name === 'string' ? person.name : ''}
                  </span>
                  <span style={{ opacity: row.discarded ? 0.5 : 1 }}>
                    {eventCount} <span className="sm:hidden">{t.events}</span>
                  </span>
                  <fieldset
                    disabled={row.discarded}
                    style={{
                      border: 'none',
                      margin: 0,
                      padding: 0,
                      minWidth: 0,
                      opacity: row.discarded ? 0.5 : 1,
                    }}
                  >
                    <PartnerFields
                      compact
                      status={row.partnerStatus}
                      partnerFrom={row.partnerFrom}
                      partnerTo={row.partnerTo}
                      onChange={(key, value) => onRowChange(row.index, { [key]: value })}
                      errors={errors}
                      t={t}
                    />
                  </fieldset>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={row.discarded}
                      onChange={(e) => onRowChange(row.index, { discarded: e.target.checked })}
                    />
                    <span className="sm:sr-only">{t.importPartnerDiscard}</span>
                  </label>
                </div>
              )
            })}

            <div style={{ ...TEXT.caption, color: PALETTE.textSoft }}>
              {importCount === 0 ? (
                <p>{t.importPartnerNothingToImport}</p>
              ) : (
                <p>
                  {unresolvedCount > 0 && (
                    <>
                      {count(unresolvedCount)} {t.importPartnerLeftToResolve} ·{' '}
                    </>
                  )}
                  {t.importJsonConfirmAction} {importCount} · {t.importPartnerSummaryDiscard}{' '}
                  {discardCount}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" style={outlineStyle} onClick={onBack}>
              {t.back}
            </Button>
            <Button
              className="rounded-xl"
              style={primaryStyle}
              disabled={unresolvedCount > 0 || importCount === 0}
              onClick={onImport}
            >
              {t.importJsonConfirmAction} {importCount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
