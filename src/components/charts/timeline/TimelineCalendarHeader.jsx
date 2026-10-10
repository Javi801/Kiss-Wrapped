import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import { navBtnStyle } from '@/components/charts/timeline/TimelineCalendarHelpers'

// Prev / title / next row of the calendar dropdown.
export default function TimelineCalendarHeader({
  label,
  canCycleTitle,
  isNextDisabled,
  onPrev,
  onNext,
  onTitleClick,
}) {
  const P = usePalette()
  const navStyle = navBtnStyle(P)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        style={navStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = P.accentMuted)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <ChevronLeft size={14} />
      </button>

      <button
        type="button"
        onClick={canCycleTitle ? onTitleClick : undefined}
        style={{
          background: 'none',
          border: 'none',
          cursor: canCycleTitle ? 'pointer' : 'default',
          padding: '0.125rem 0.5rem',
          borderRadius: '0.5rem',
          ...TEXT.bodyStrong,
          color: P.text,
          textTransform: 'capitalize',
          transition: 'background-color 0.1s',
        }}
        onMouseEnter={(e) => {
          if (canCycleTitle) e.currentTarget.style.backgroundColor = P.accentMuted
        }}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {label}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled}
        style={{
          ...navStyle,
          cursor: isNextDisabled ? 'default' : 'pointer',
          color: isNextDisabled ? P.line : P.textSoft,
        }}
        onMouseEnter={(e) => {
          if (!isNextDisabled) e.currentTarget.style.backgroundColor = P.accentMuted
        }}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
