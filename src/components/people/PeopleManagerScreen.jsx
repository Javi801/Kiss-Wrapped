import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Filter, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'
import { formatDisplayDate, calculateAge } from '@/lib/date'
import { getFirstEventDate, getLastEventDate } from '@/lib/stats'

import EmptyState from '@/components/people/EmptyState'
import PersonCard from '@/components/person/PersonCard'
import FiltersPanel from '@/components/forms/FiltersPanel'

const ALPHA_INDEX = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')]

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
}) {
  const PALETTE = usePalette()
  const [query, setQuery] = useState('')

  const [filters, setFilters] = useState({
    minAge: '',
    maxAge: '',
    activity: [],
    zodiacSign: [],
    eventDateFrom: '',
    eventDateTo: '',
  })

  const [groupBy, setGroupBy] = useState('name')
  const [sortBy, setSortBy] = useState('name')
  const [filterOpen, setFilterOpen] = useState(false)

  const alphabetRef = useRef(null)
  const [activeLetter, setActiveLetter] = useState(null)
  const fadeTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(fadeTimerRef.current), [])

  function activateLetter(letter) {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    setActiveLetter(letter)
    fadeTimerRef.current = setTimeout(() => setActiveLetter(null), 900)
  }

  function handleFilterOpenChange(open) {
    setFilterOpen(open)
    modalBackRef.current = open ? () => setFilterOpen(false) : null
  }

  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase()

    const result = people.filter((person) => {
      const searchable = [
        person.name,
        person.realName || '',
        person.detail || '',
        person.howWeMet || '',
        ...(person.events || []).map((event) => event.details || ''),
      ]
        .join(' ')
        .toLowerCase()

      const matchesQuery = !q || searchable.includes(q)
      const age = calculateAge(person.birthYear, person.zodiacSign) ?? person.age
      const matchesMinAge = !filters.minAge || age >= Number(filters.minAge)
      const matchesMaxAge = !filters.maxAge || age <= Number(filters.maxAge)
      const matchesActivity =
        filters.activity.length === 0 || filters.activity.includes(person.activity)
      const matchesZodiac =
        filters.zodiacSign.length === 0 ||
        filters.zodiacSign.some((z) => z[0] === person.zodiacSign?.[0])
      const matchesEventDate = (() => {
        if (!filters.eventDateFrom && !filters.eventDateTo) return true
        return (person.events || []).some((event) => {
          if (!event.date) return false
          if (filters.eventDateFrom && event.date < filters.eventDateFrom) return false
          if (filters.eventDateTo && event.date > filters.eventDateTo) return false
          return true
        })
      })()

      return (
        matchesQuery &&
        matchesMinAge &&
        matchesMaxAge &&
        matchesActivity &&
        matchesZodiac &&
        matchesEventDate
      )
    })

    return [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'firstEventDate') {
        const aDate = getFirstEventDate(a) || '9999.99.99'
        const bDate = getFirstEventDate(b) || '9999.99.99'
        return aDate.localeCompare(bDate)
      }
      const aDate = getLastEventDate(a) || '0000.00.00'
      const bDate = getLastEventDate(b) || '0000.00.00'
      return bDate.localeCompare(aDate)
    })
  }, [people, query, filters, sortBy])

  const grouped = useMemo(() => {
    const groups = {}

    for (const person of filteredPeople) {
      let key = t.ungrouped

      if (groupBy === 'name') {
        const first = person.name[0]?.toUpperCase() || '#'
        key = /^[A-Z]$/.test(first) ? first : '#'
      }

      if (groupBy === 'lastEventDate') {
        key = getLastEventDate(person) || t.noEvents
      }

      if (!groups[key]) {
        groups[key] = []
      }

      groups[key].push(person)
    }

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredPeople, groupBy, t])

  // Alphabet sidebar is only meaningful when grouping by name.
  const showAlphabet = groupBy === 'name'

  const activeLetters = useMemo(() => new Set(grouped.map(([g]) => g)), [grouped])

  function scrollToGroup(letter) {
    const el = document.getElementById(`group-${letter}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleAlphabetTouchMove(e) {
    e.preventDefault()
    if (!e.touches.length) return
    const touch = e.touches[0]
    const target = document.elementFromPoint(touch.clientX, touch.clientY)
    const letter = target?.dataset?.letter
    if (letter && activeLetters.has(letter)) {
      // Clear any pending fade so the circle stays visible while dragging.
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
      setActiveLetter(letter)
      scrollToGroup(letter)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ ...TEXT.heading, letterSpacing: '-0.025em', color: PALETTE.text }}>
          {t.personListTitle}
        </h2>
      </div>

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
              overflowY: 'auto',
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

            <div style={{ marginTop: '0.75rem', padding: '0 1rem 1.5rem' }}>
              <FiltersPanel
                filters={filters}
                setFilters={setFilters}
                groupBy={groupBy}
                setGroupBy={setGroupBy}
                sortBy={sortBy}
                setSortBy={setSortBy}
                peopleCount={filteredPeople.length}
                t={t}
                language={language}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {filteredPeople.length ? (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {/* Alphabet index — sticky strip on the left */}
          {showAlphabet && (
            // Outer div is sticky; inner div is relative (containing block for the indicator).
            <div
              style={{
                width: '20px',
                flexShrink: 0,
                position: 'sticky',
                top: '1rem',
                alignSelf: 'flex-start',
                height: 'calc(100svh - 9rem)',
              }}
            >
              <div
                ref={alphabetRef}
                onTouchMove={handleAlphabetTouchMove}
                onTouchEnd={() => {
                  if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
                  fadeTimerRef.current = setTimeout(() => setActiveLetter(null), 900)
                }}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingTop: '0.125rem',
                  paddingBottom: '0.125rem',
                }}
              >
                {/* Floating circle — always rendered, transitions opacity & position */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top:
                      activeLetter !== null
                        ? `${(ALPHA_INDEX.indexOf(activeLetter) / (ALPHA_INDEX.length - 1)) * 100}%`
                        : '50%',
                    transform:
                      'translate(-50%, -50%) scale(' + (activeLetter !== null ? '1' : '0.4') + ')',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: PALETTE.accentMuted,
                    opacity: activeLetter !== null ? 0.85 : 0,
                    pointerEvents: 'none',
                    transition:
                      'top 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease, transform 0.2s ease',
                  }}
                />

                {ALPHA_INDEX.map((letter) => {
                  const active = activeLetters.has(letter)
                  const selected = activeLetter === letter
                  return (
                    <button
                      key={letter}
                      data-letter={letter}
                      onClick={() => {
                        if (!active) return
                        activateLetter(letter)
                        scrollToGroup(letter)
                      }}
                      style={{
                        all: 'unset',
                        display: 'flex',
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        fontSize: '0.55rem',
                        fontWeight: selected ? '800' : active ? '700' : '400',
                        lineHeight: 1,
                        color: selected
                          ? PALETTE.accentEmphasis
                          : active
                            ? PALETTE.accent
                            : PALETTE.textSoft,
                        opacity: active ? 1 : 0.3,
                        cursor: active ? 'pointer' : 'default',
                        transition: 'color 0.15s',
                        WebkitTapHighlightColor: 'transparent',
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      {letter}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Grouped list */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {grouped.map(([group, members]) => (
              <div key={group}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  {/* Group header */}
                  <div
                    id={`group-${group}`}
                    className="rounded-2xl"
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      paddingLeft: '0.75rem',
                      paddingRight: '0.75rem',
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                      backdropFilter: 'blur(8px)',
                      backgroundColor: PALETTE.surfaceBg,
                    }}
                  >
                    <p
                      style={{
                        ...TEXT.label,
                        textTransform: 'uppercase',
                        letterSpacing: '0.16em',
                        color: PALETTE.accent,
                      }}
                    >
                      {groupBy === 'lastEventDate' && group !== t.noEvents
                        ? formatDisplayDate(group)
                        : group}
                    </p>
                  </div>

                  {/* Group members */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {members.map((person) => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        onUpdatePerson={onUpdatePerson}
                        onDeletePerson={onDeletePerson}
                        onAddEvent={onAddEvent}
                        onUpdateEvent={onUpdateEvent}
                        onDeleteEvent={onDeleteEvent}
                        onDeleteAllEvents={onDeleteAllEvents}
                        t={t}
                        language={language}
                        modalBackRef={modalBackRef}
                        situationTags={situationTags}
                        onAddSituationTag={onAddSituationTag}
                        placeTags={placeTags}
                        onAddPlaceTag={onAddPlaceTag}
                        howWeMetTags={howWeMetTags}
                        onAddHowWeMetTag={onAddHowWeMetTag}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              onClick={() => {
                setQuery('')
                setFilters({
                  minAge: '',
                  maxAge: '',
                  activity: [],
                  zodiacSign: [],
                  eventDateFrom: '',
                  eventDateTo: '',
                })
              }}
            >
              {t.clearSearch}
            </Button>
          }
        />
      )}
    </div>
  )
}
