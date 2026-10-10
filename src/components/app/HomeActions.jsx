import { BarChart3, Download, Trash2, Upload, UserPlus, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import TapGuide from '@/components/visuals/TapGuide'
import SpeechBubble from '@/components/forms/SpeechBubble'

const dataButtonLabelStyle = {
  fontSize: '0.625rem',
  fontWeight: '600',
  letterSpacing: '0.04em',
  lineHeight: '1',
}

/**
 * Action buttons of the main screen: navigation to the other screens and the
 * data section (export, import and clear). For the onboarding tour,
 * `guideTarget="people"` shows the tap guide on the people button and
 * `dataHint` (`{ title, body }`) a speech bubble over export and import.
 */
export default function HomeActions({
  t,
  onNavigate,
  onExportJson,
  onImportJson,
  onClearData,
  guideTarget,
  dataHint,
}) {
  const PALETTE = usePalette()

  const outlineActionStyle = {
    height: '3.5rem',
    justifyContent: 'flex-start',
    ...TEXT.body,
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.controlBg,
  }

  const dataButtonStyle = {
    height: '4rem',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.5rem',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.controlBg,
  }

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <Button
        className="rounded-3xl"
        style={{
          height: '3.5rem',
          justifyContent: 'flex-start',
          ...TEXT.body,
          color: PALETTE.textOnAccent,
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
        }}
        onClick={() => onNavigate('add')}
      >
        <UserPlus style={{ marginRight: '0.75rem', height: '1.25rem', width: '1.25rem' }} />
        {t.addNewPerson}
      </Button>

      <Button
        variant="outline"
        className="rounded-3xl"
        style={
          guideTarget === 'people'
            ? { ...outlineActionStyle, position: 'relative' }
            : outlineActionStyle
        }
        onClick={() => onNavigate('people')}
      >
        {guideTarget === 'people' && <TapGuide />}
        <Users
          style={{
            marginRight: '0.75rem',
            height: '1.25rem',
            width: '1.25rem',
            color: PALETTE.accent,
          }}
        />
        {t.viewEditPeople}
      </Button>

      <Button
        variant="outline"
        className="rounded-3xl"
        style={outlineActionStyle}
        onClick={() => onNavigate('stats')}
      >
        <BarChart3
          style={{
            marginRight: '0.75rem',
            height: '1.25rem',
            width: '1.25rem',
            color: PALETTE.accent2,
          }}
        />
        {t.viewStatistics}
      </Button>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.375rem',
          paddingTop: '0.25rem',
        }}
      >
        <div style={{ height: '1px', backgroundColor: PALETTE.inputBorder }} />
        <span style={{ ...TEXT.label, color: PALETTE.textSoft, paddingLeft: '0.25rem' }}>
          {t.dataSection}
        </span>
      </div>

      {dataHint && (
        <SpeechBubble
          title={dataHint.title}
          tailSide="bottom"
          tailOffset={{ left: 'calc(33.3% - 0.3125rem)' }}
        >
          {dataHint.body}
        </SpeechBubble>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        <Button
          variant="outline"
          className="rounded-2xl"
          style={dataButtonStyle}
          onClick={onExportJson}
        >
          <Upload style={{ height: '1.25rem', width: '1.25rem', color: PALETTE.accent2 }} />
          <span style={dataButtonLabelStyle}>{t.exportJsonLabel}</span>
        </Button>

        <Button
          variant="outline"
          className="rounded-2xl"
          style={dataButtonStyle}
          onClick={onImportJson}
        >
          <Download style={{ height: '1.25rem', width: '1.25rem', color: PALETTE.accent2 }} />
          <span style={dataButtonLabelStyle}>{t.importJsonLabel}</span>
        </Button>

        <Button
          variant="outline"
          className="rounded-2xl"
          style={{ ...dataButtonStyle, color: PALETTE.dangerEmphasis }}
          onClick={onClearData}
        >
          <Trash2 style={{ height: '1.25rem', width: '1.25rem' }} />
          <span style={dataButtonLabelStyle}>{t.clearLocalDataLabel}</span>
        </Button>
      </div>
    </div>
  )
}
