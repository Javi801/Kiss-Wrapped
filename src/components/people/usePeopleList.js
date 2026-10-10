import { useMemo, useState } from 'react'

import { emptyFilters, filterPeople, groupPeople, sortPeople } from '@/components/people/peopleList'

// Search, filter, sort and grouping state of the people list.
export default function usePeopleList(people, t) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(emptyFilters)
  const [groupBy, setGroupBy] = useState('name')
  const [sortBy, setSortBy] = useState('name')

  const filteredPeople = useMemo(
    () => sortPeople(filterPeople(people, query, filters), sortBy),
    [people, query, filters, sortBy]
  )

  const grouped = useMemo(
    () => groupPeople(filteredPeople, groupBy, t),
    [filteredPeople, groupBy, t]
  )

  function clearSearch() {
    setQuery('')
    setFilters(emptyFilters())
  }

  return {
    query,
    setQuery,
    filters,
    setFilters,
    groupBy,
    setGroupBy,
    sortBy,
    setSortBy,
    filteredPeople,
    grouped,
    clearSearch,
  }
}
