import { Users } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

import AlphabetIndex from '@/components/people/AlphabetIndex'
import EmptyState from '@/components/people/EmptyState'
import PeopleGroupList from '@/components/people/PeopleGroupList'
import PeopleToolbar from '@/components/people/PeopleToolbar'
import usePeopleList from '@/components/people/usePeopleList'

export default function PeopleManagerScreen({
  people,
  onUpdatePerson,
  onDeletePerson,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onDeleteAllEvents,
  t,
  language,
  modalBackRef,
  situationTags,
  onAddSituationTag,
  placeTags,
  onAddPlaceTag,
  howWeMetTags,
  onAddHowWeMetTag,
  cardTour,
}) {
  const PALETTE = usePalette()
  const list = usePeopleList(people, t)

  // Alphabet sidebar is only meaningful when grouping by name.
  const showAlphabet = list.groupBy === 'name'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ ...TEXT.heading, color: PALETTE.text }}>{t.personListTitle}</h2>
      </div>

      <PeopleToolbar
        query={list.query}
        setQuery={list.setQuery}
        filters={list.filters}
        setFilters={list.setFilters}
        groupBy={list.groupBy}
        setGroupBy={list.setGroupBy}
        sortBy={list.sortBy}
        setSortBy={list.setSortBy}
        peopleCount={list.filteredPeople.length}
        t={t}
        language={language}
        modalBackRef={modalBackRef}
      />

      {list.filteredPeople.length ? (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {/* Alphabet index — sticky strip on the left */}
          {showAlphabet && <AlphabetIndex grouped={list.grouped} />}

          {/* Grouped list */}
          <PeopleGroupList
            grouped={list.grouped}
            groupBy={list.groupBy}
            t={t}
            cardProps={{
              onUpdatePerson,
              onDeletePerson,
              onAddEvent,
              onUpdateEvent,
              onDeleteEvent,
              onDeleteAllEvents,
              language,
              modalBackRef,
              situationTags,
              onAddSituationTag,
              placeTags,
              onAddPlaceTag,
              howWeMetTags,
              onAddHowWeMetTag,
              tour: cardTour,
            }}
          />
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={t.noPeopleFound}
          description={t.tryDifferent}
          action={
            <Button
              variant="outline"
              className="rounded-2xl"
              style={{ borderColor: PALETTE.inputBorder, backgroundColor: PALETTE.card }}
              onClick={list.clearSearch}
            >
              {t.clearSearch}
            </Button>
          }
        />
      )}
    </div>
  )
}
