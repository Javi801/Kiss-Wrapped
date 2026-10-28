import { BookOpen, Check, Info, Languages, RotateCcw, Settings, Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import ColorSelector from '@/components/app/ColorSelector'

const headerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.75rem',
}

// Row button of the settings dialog that leads somewhere else.
function SettingsAction({ icon: Icon, label, onClick }) {
  const PALETTE = usePalette()

  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-2xl"
      style={{
        height: '3rem',
        justifyContent: 'flex-start',
        ...TEXT.body,
        borderColor: PALETTE.inputBorder,
        backgroundColor: PALETTE.controlBg,
        color: PALETTE.text,
      }}
      onClick={onClick}
    >
      <Icon
        style={{
          marginRight: '0.75rem',
          height: '1rem',
          width: '1rem',
          color: PALETTE.accent,
        }}
      />
      {label}
    </Button>
  )
}

/**
 * Dialogs opened from the hero card of the main screen: the language picker and
 * the settings, which also lead to the tags, the app guide, the about dialog and,
 * when `onRestartOnboarding` is given, the onboarding.
 */
export default function HomeSettingsDialogs({
  t,
  language,
  setLanguage,
  iconColor,
  setIconColor,
  theme,
  setTheme,
  languageOpen,
  setLanguageOpen,
  settingsOpen,
  setSettingsOpen,
  onOpenAbout,
  onOpenTags,
  onOpenGuide,
  onRestartOnboarding,
}) {
  const PALETTE = usePalette()

  const languageOptions = [
    { value: 'en', label: t.english },
    { value: 'es', label: t.spanish },
  ]

  return (
    <>
      <Dialog open={languageOpen} onOpenChange={setLanguageOpen}>
        <DialogContent>
          <DialogHeader>
            <div style={headerStyle}>
              <div
                className="rounded-full"
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 14px ${PALETTE.accentGlow}`,
                }}
              >
                <Languages
                  style={{ height: '1.5rem', width: '1.5rem', color: PALETTE.textOnAccent }}
                />
              </div>
              <DialogTitle style={{ ...TEXT.subheading, color: PALETTE.accentEmphasis2 }}>
                {t.language}
              </DialogTitle>
            </div>
          </DialogHeader>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {languageOptions.map((option) => {
              const selected = option.value === language

              return (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  style={{
                    height: '3.25rem',
                    justifyContent: 'space-between',
                    ...TEXT.base,
                    fontWeight: selected ? '600' : '400',
                    borderColor: selected ? PALETTE.accent : PALETTE.line,
                    backgroundColor: selected ? PALETTE.accentMuted : PALETTE.card,
                    color: selected ? PALETTE.accent : PALETTE.text,
                    boxShadow: selected ? `0 2px 8px ${PALETTE.accentShadow}` : 'none',
                  }}
                  onClick={() => {
                    setLanguage(option.value)
                    setLanguageOpen(false)
                  }}
                >
                  {option.label}
                  {selected ? (
                    <Check style={{ height: '1.25rem', width: '1.25rem', color: PALETTE.accent }} />
                  ) : null}
                </Button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <div style={headerStyle}>
              <div
                className="rounded-full"
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  background: `linear-gradient(135deg, ${PALETTE.accentEmphasis2}, ${PALETTE.emphasisEnd})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 14px rgba(60,9,108,0.25)`,
                }}
              >
                <Settings
                  style={{ height: '1.5rem', width: '1.5rem', color: PALETTE.textOnAccent }}
                />
              </div>
              <DialogTitle style={{ ...TEXT.subheading, color: PALETTE.accentEmphasis2 }}>
                {t.settings}
              </DialogTitle>
            </div>
          </DialogHeader>
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ColorSelector
              iconColor={iconColor}
              setIconColor={setIconColor}
              theme={theme}
              setTheme={setTheme}
              t={t}
              accent={false}
            />
            <SettingsAction
              icon={Tag}
              label={t.manageTags}
              onClick={() => {
                setSettingsOpen(false)
                onOpenTags()
              }}
            />
            <SettingsAction
              icon={BookOpen}
              label={t.appGuide}
              onClick={() => {
                setSettingsOpen(false)
                onOpenGuide()
              }}
            />
            {onRestartOnboarding && (
              <SettingsAction
                icon={RotateCcw}
                label={t.restartOnboarding}
                onClick={() => {
                  setSettingsOpen(false)
                  onRestartOnboarding()
                }}
              />
            )}
            <SettingsAction
              icon={Info}
              label={t.about}
              onClick={() => {
                setSettingsOpen(false)
                onOpenAbout()
              }}
            />
          </section>
        </DialogContent>
      </Dialog>
    </>
  )
}
