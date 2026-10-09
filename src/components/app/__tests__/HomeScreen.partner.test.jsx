import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { COPY } from '@/lib/constants'

// Props of every StatTile rendered by the hero card.
const tiles = vi.hoisted(() => ({ current: [] }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/lib/device-storage', () => ({ exportPeopleJson: vi.fn() }))
vi.mock('@/lib/pdf-export', () => ({ saveErrorLog: vi.fn() }))
vi.mock('@/components/app/ColorSelector', () => ({ default: () => null }))
vi.mock('@/components/ui/dialog', () => ({
  Dialog: () => null,
  DialogContent: () => null,
  DialogHeader: () => null,
  DialogTitle: () => null,
  DialogDescription: () => null,
  DialogFooter: () => null,
}))
vi.mock('@/components/shared/StatTile', () => ({
  default: (props) => {
    tiles.current.push(props)
    return null
  },
}))

import MainScreen from '@/components/app/HomeScreen'

const t = COPY.en

const ana = {
  id: 'ana',
  name: 'Ana',
  partnerStatus: 'never',
  partnerFrom: '',
  partnerTo: '',
  events: [
    { id: 'a1', date: '2024.01.01' },
    { id: 'a2', date: '2024.02.01' },
  ],
}

const partner = (overrides) => ({
  id: 'mia',
  name: 'Mia',
  partnerStatus: 'current',
  partnerFrom: '',
  partnerTo: '',
  events: [
    { id: 'm1', date: '2022.06.01' },
    { id: 'm2', date: '2023.06.01' },
    { id: 'm3', date: '2024.06.01' },
  ],
  ...overrides,
})

function renderHome(people, props = {}) {
  renderToStaticMarkup(
    <MainScreen people={people} t={t} language="en" statsVisible={true} {...props} />
  )
}

const tileValue = (label) => tiles.current.find((tile) => tile.label === label)?.value

describe('HomeScreen — total events with partners', () => {
  beforeEach(() => {
    tiles.current = []
  })

  it('counts every event when nobody is a partner', () => {
    renderHome([ana, partner({ partnerStatus: 'never' })])
    expect(tileValue(t.totalEvents)).toBe(5)
  })

  it('leaves out all the events of a current partner with no start date', () => {
    renderHome([ana, partner()])
    expect(tileValue(t.totalEvents)).toBe(2)
  })

  it('only leaves out the events after the start of a current partner period', () => {
    renderHome([ana, partner({ partnerFrom: '2023.01.01' })])
    expect(tileValue(t.totalEvents)).toBe(3)
  })

  it('only leaves out the events inside a past partner period', () => {
    renderHome([
      ana,
      partner({ partnerStatus: 'past', partnerFrom: '2023.01.01', partnerTo: '2023.12.31' }),
    ])
    expect(tileValue(t.totalEvents)).toBe(4)
  })

  it('still counts partners as saved people', () => {
    renderHome([ana, partner()])
    expect(tileValue(t.peopleSaved)).toBe(2)
  })

  it('hides both counters when stats are not visible', () => {
    renderHome([ana, partner()], { statsVisible: false })
    expect(tileValue(t.totalEvents)).toBe('-')
    expect(tileValue(t.peopleSaved)).toBe('-')
  })
})
