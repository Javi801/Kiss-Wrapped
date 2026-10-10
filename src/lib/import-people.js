import { hasPartnerIssues, prefillPartnerFields } from '@/lib/partner'

// Builds the import status for the parsed content of a JSON file.
// People whose id is already saved are skipped; the new ones with invalid partner
// data get a row each, holding the index in `data`, the prefilled fields and `discarded`.
export function buildImportStatus(parsed, people) {
  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => item && typeof item === 'object' && !Array.isArray(item))
  ) {
    return { type: 'error_format' }
  }

  const existingIds = new Set(people.map((p) => p.id))
  const newPeople = parsed.filter((p) => !existingIds.has(p.id))
  const skippedCount = parsed.length - newPeople.length

  if (newPeople.length === 0) {
    return { type: 'empty', totalInFile: parsed.length }
  }

  const rows = newPeople.flatMap((person, index) =>
    hasPartnerIssues(person) ? [{ index, discarded: false, ...prefillPartnerFields(person) }] : []
  )

  return {
    type: rows.length > 0 ? 'partner_issues' : 'confirm',
    totalInFile: parsed.length,
    newCount: newPeople.length,
    skippedCount,
    data: newPeople,
    rows,
  }
}

// Returns only the people without partner issues, and the status that follows the import.
export function skipPartnerIssues(importStatus) {
  const issueIndexes = new Set(importStatus.rows.map((row) => row.index))
  const people = importStatus.data.filter((_person, index) => !issueIndexes.has(index))
  return {
    people,
    status: {
      type: 'success',
      newCount: people.length,
      skippedIssueCount: importStatus.rows.length,
    },
  }
}

// Returns the valid people plus the fixed rows, in file order, and the status that
// follows the import; discarded rows are dropped.
export function resolvePartnerIssues(importStatus) {
  const rowByIndex = new Map(importStatus.rows.map((row) => [row.index, row]))
  const people = importStatus.data.flatMap((person, index) => {
    const row = rowByIndex.get(index)
    if (!row) return [person]
    if (row.discarded) return []
    return [
      {
        ...person,
        partnerStatus: row.partnerStatus,
        partnerFrom: row.partnerStatus !== 'never' ? row.partnerFrom : '',
        partnerTo: row.partnerStatus === 'past' ? row.partnerTo : '',
      },
    ]
  })
  return {
    people,
    status: {
      type: 'success',
      newCount: people.length,
      discardedCount: importStatus.rows.filter((row) => row.discarded).length,
    },
  }
}
