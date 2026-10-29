import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { usePalette } from '@/lib/theme'
import PersonForm from '@/components/forms/PersonForm'
import FormCard from '@/components/app/FormCard'

/**
 * Renders the screen used to add a new person.
 * It wraps the shared person form with navigation controls.
 */
export default function AddPersonScreen({ onSave, onBack, t, language }) {
  const PALETTE = usePalette()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
      {/* Back action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <Button
          variant="ghost"
          className="rounded-2xl"
          style={{ color: PALETTE.accentEmphasis }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PALETTE.accentMuted)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          onClick={onBack}
        >
          <ArrowLeft style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />
          {t.back}
        </Button>
      </div>

      {/* Form container */}
      <FormCard>
        <PersonForm
          onSave={onSave}
          onCancel={onBack}
          t={t}
          language={language}
          includeHowWeMet={false}
          mode="add"
          saveLabel={t.saveAndBack}
        />
      </FormCard>
    </div>
  )
}
