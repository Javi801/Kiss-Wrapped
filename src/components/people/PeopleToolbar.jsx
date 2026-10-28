import { useState } from 'react'
import { Search, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

import { usePalette } from '@/lib/theme'
import { useScrollFade } from '@/hooks/useScrollFade'

import FiltersPanel from '@/components/forms/FiltersPanel'

// Search box plus the filter sheet of the people list.
export default function PeopleToolbar({
  query,
  setQuery,
  filters,
  setFilters,
  groupBy,
  setGroupBy,
  sortBy,
  setSortBy,
  peopleCount,
  t,
  language,
  modalBackRef,
  howWeMetTags = [],
  nationalityTags = [],
}) {
  const PALETTE = usePalette()
  const [filterOpen, setFilterOpen] = useState(false)
  const scrollFadeRef = useScrollFade()

  function handleFilterOpenChange(open) {
    setFilterOpen(open)
    if (!modalBackRef) return
    modalBackRef.current = open ? () => setFilterOpen(false) : null
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', flex: '1 1 0%' }}>
        <Search
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            height: '1rem',
            width: '1rem',
            transform: 'translateY(-50%)',
            color: PALETTE.accent,
          }}
        />
        <Input
          className="rounded-2xl"
          style={{
            paddingLeft: '2.25rem',
            borderColor: PALETTE.inputBorder,
            backgroundColor: PALETTE.controlBg,
          }}
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Sheet open={filterOpen} onOpenChange={handleFilterOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="rounded-2xl"
            style={{
              borderColor: PALETTE.inputBorder,
              backgroundColor: PALETTE.controlBg,
            }}
          >
            <Filter style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />
            {t.filters}
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          style={{
            width: '80%',
            maxWidth: '20rem',
            borderLeftColor: PALETTE.cardBorder,
            background: `linear-gradient(180deg, ${PALETTE.accentMuted} 0%, ${PALETTE.card} 55%)`,
          }}
        >
          <SheetHeader style={{ padding: '1.25rem 1rem 0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.625rem',
                  background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 2px 8px ${PALETTE.accentGlow}`,
                }}
              >
                <Filter size={14} style={{ color: 'white' }} />
              </div>
              <SheetTitle
                style={{
                  background: `linear-gradient(90deg, ${PALETTE.text}, ${PALETTE.accent})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  letterSpacing: '-0.02em',
                }}
              >
                {t.refineList}
              </SheetTitle>
            </div>
          </SheetHeader>

          <div
            ref={scrollFadeRef}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '0.75rem 1rem 1.5rem',
            }}
          >
            <FiltersPanel
              filters={filters}
              setFilters={setFilters}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
              sortBy={sortBy}
              setSortBy={setSortBy}
              peopleCount={peopleCount}
              t={t}
              language={language}
              howWeMetTags={howWeMetTags}
              nationalityTags={nationalityTags}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
