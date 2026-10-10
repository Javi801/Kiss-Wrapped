// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY, ZODIAC_OPTIONS } from '@/lib/constants'
import { formatShortDate } from '@/lib/date'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/forms/PersonForm', () => ({ default: () => null }))
vi.mock('@/components/forms/EventForm', () => ({ default: () => null }))
vi.mock('framer-motion', async () => {
  const { createElement, Fragment } = await import('react')
  return {
    motion: {
      // Drops the animation props so they don't reach the DOM.
      // eslint-disable-next-line no-unused-vars
      div: ({ layout, initial, animate, exit, children, ...rest }) =>
        createElement('div', rest, children),
    },
    AnimatePresence: ({ children }) => createElement(Fragment, null, children),
  }
})
vi.mock('@/components/ui/dialog', () => ({
  Dialog: () => null,
  DialogContent: () => null,
  DialogHeader: () => null,
  DialogTitle: () => null,
  DialogDescription: () => null,
}))
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: () => null,
  AlertDialogAction: () => null,
  AlertDialogCancel: () => null,
  AlertDialogContent: () => null,
  AlertDialogDescription: () => null,
  AlertDialogFooter: () => null,
  AlertDialogHeader: () => null,
  AlertDialogTitle: () => null,
  AlertDialogTrigger: () => null,
}))

import PersonCard from '@/components/person/PersonCard'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

const basePerson = {
  id: 'mia',
  name: 'Mia',
  birthYear: 1995,
  gender: 'female',
  activity: 'works',
  zodiacSign: ZODIAC_OPTIONS.en[0],
  partnerStatus: 'never',
  partnerFrom: '',
  partnerTo: '',
  events: [],
}

let container
let root

function renderCard(overrides) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<PersonCard person={{ ...basePerson, ...overrides }} t={t} language="en" />)
  })
}

// The header is the first button of the card; clicking it shows the details.
function expand() {
  act(() => {
    container.querySelector('button').click()
  })
}

// Partner badges only; the card can also show the missing-details badge.
const badges = () =>
  [...container.querySelectorAll('[data-slot="badge"]')]
    .map((badge) => badge.textContent)
    .filter((text) => text === t.partnerBadge || text === t.exPartnerBadge)

const lines = () => [...container.querySelectorAll('p')].map((line) => line.textContent)

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('PersonCard — partner badge', () => {
  it('shows no partner badge for someone who was never a partner', () => {
    renderCard({ partnerStatus: 'never' })
    expect(badges()).toEqual([])
  })

  it('shows the partner badge for a current partner', () => {
    renderCard({ partnerStatus: 'current' })
    expect(badges()).toEqual([t.partnerBadge])
  })

  it('shows the ex-partner badge for a past partner', () => {
    renderCard({ partnerStatus: 'past', partnerTo: '2023.12.31' })
    expect(badges()).toEqual([t.exPartnerBadge])
  })

  it('shows no partner badge for an unknown status', () => {
    renderCard({ partnerStatus: 'maybe' })
    expect(badges()).toEqual([])
  })
})

describe('PersonCard — partner period', () => {
  it('hides the period while the card is collapsed', () => {
    renderCard({ partnerStatus: 'current', partnerFrom: '2023.01.01' })
    expect(lines()).toEqual([])
  })

  it('shows the start date of a current partner', () => {
    renderCard({ partnerStatus: 'current', partnerFrom: '2023.01.01' })
    expand()
    expect(lines()).toContain(
      `${t.partnerBadge}: ${t.partnerSinceWord} ${formatShortDate('2023.01.01', 'en')}`
    )
  })

  it('shows no period for a current partner without a start date', () => {
    renderCard({ partnerStatus: 'current' })
    expand()
    expect(lines().filter((line) => line.startsWith(`${t.partnerBadge}:`))).toEqual([])
  })

  it('shows the full range of a past partner', () => {
    renderCard({ partnerStatus: 'past', partnerFrom: '2023.01.01', partnerTo: '2023.12.31' })
    expand()
    expect(lines()).toContain(
      `${t.partnerBadge}: ${formatShortDate('2023.01.01', 'en')} – ${formatShortDate('2023.12.31', 'en')}`
    )
  })

  it('shows only the end date of a past partner without a start date', () => {
    renderCard({ partnerStatus: 'past', partnerTo: '2023.12.31' })
    expand()
    expect(lines()).toContain(
      `${t.partnerBadge}: ${t.partnerUntilWord} ${formatShortDate('2023.12.31', 'en')}`
    )
  })

  it('shows no period for someone who was never a partner, even with stale dates', () => {
    renderCard({ partnerStatus: 'never', partnerFrom: '2023.01.01', partnerTo: '2023.12.31' })
    expand()
    expect(lines().filter((line) => line.startsWith(`${t.partnerBadge}:`))).toEqual([])
  })
})
