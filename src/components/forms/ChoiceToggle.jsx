import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

/**
 * Row of mutually exclusive buttons; the selected one is filled with the accent color.
 * `options` holds `{ value, label }` pairs and `onChange` receives the chosen value.
 */
export default function ChoiceToggle({ options, value, onChange }) {
  const PALETTE = usePalette()
  return (
    <div
      style={{
        display: 'flex',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        border: `1px solid ${PALETTE.inputBorder}`,
        width: 'fit-content',
        backgroundColor: PALETTE.inputBg,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            style={{
              padding: '0.25rem 1rem',
              ...TEXT.caption,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: selected ? PALETTE.accent : 'transparent',
              color: selected ? PALETTE.textOnAccent : PALETTE.text,
              transition: 'background-color 0.15s, color 0.15s',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
