import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { COPY } from '@/lib/constants'

const donutProps = vi.hoisted(() => ({ current: null }))

vi.mock('@/components/charts/DonutCard', () => ({
  default: (props) => {
    donutProps.current = props
    return null
  },
}))

import ActivityDonutCard from '@/components/stats/ActivityDonutCard'
import GenderDonutCard from '@/components/stats/GenderDonutCard'

const persons = [{ label: 'A', value: 2 }]
const events = [{ label: 'A', value: 7 }]

describe.each([
  [
    'ActivityDonutCard',
    (t) => (
      <ActivityDonutCard
        personsByActivity={persons}
        eventsByActivity={events}
        emptyText="none"
        t={t}
      />
    ),
    { persons: 'personsByActivity', events: 'eventsByActivity' },
  ],
  [
    'GenderDonutCard',
    (t) => (
      <GenderDonutCard personsByGender={persons} eventsByGender={events} emptyText="none" t={t} />
    ),
    { persons: 'personsByGender', events: 'eventsByGender' },
  ],
])('%s', (_name, element, titles) => {
  beforeEach(() => {
    donutProps.current = null
  })

  it.each(['en', 'es'])('feeds each mode its own dataset and title (%s)', (language) => {
    const t = COPY[language]
    renderToStaticMarkup(element(t))
    const { modes } = donutProps.current
    expect(modes.persons.data).toBe(persons)
    expect(modes.events.data).toBe(events)
    expect(modes.persons.title).toBe(t[titles.persons])
    expect(modes.events.title).toBe(t[titles.events])
  })

  it('shows the people mode first', () => {
    renderToStaticMarkup(element(COPY.en))
    expect(donutProps.current.order).toEqual(['persons', 'events'])
  })

  it('counts people in the people mode and events in the events mode', () => {
    const t = COPY.en
    renderToStaticMarkup(element(t))
    const { modes } = donutProps.current
    expect(modes.persons.tooltipUnit).toEqual({ one: t.chartPerson, many: t.chartPersons })
    expect(modes.events.tooltipUnit).toEqual({ one: t.chartEvent, many: t.chartEvents })
  })

  it('capitalizes the events mode label', () => {
    renderToStaticMarkup(element({ ...COPY.en, chartEvents: 'events' }))
    expect(donutProps.current.modes.events.label).toBe('Events')
  })

  it('forwards the empty text', () => {
    renderToStaticMarkup(element(COPY.en))
    expect(donutProps.current.emptyText).toBe('none')
  })
})
