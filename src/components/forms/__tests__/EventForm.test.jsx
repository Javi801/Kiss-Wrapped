// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY, SCORE_OPTIONS } from '@/lib/constants'
import { todayString } from '@/lib/date'

const fields = vi.hoisted(() => ({ select: null, date: null, tags: {} }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/ui/select', async () => {
  const { createElement } = await import('react')
  return {
    Select: (props) => {
      fields.select = props
      return createElement('div', null, props.children)
    },
    SelectTrigger: () => null,
    SelectValue: () => null,
    SelectContent: ({ children }) => createElement('ul', null, children),
    SelectItem: ({ value }) => createElement('li', { 'data-value': value }),
  }
})
vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: (props) => {
    fields.date = props
    return null
  },
}))
vi.mock('@/components/ui/alert-dialog', async () => {
  const { createElement } = await import('react')
  const passthrough = ({ children }) => children
  return {
    AlertDialog: passthrough,
    AlertDialogTrigger: passthrough,
    AlertDialogContent: passthrough,
    AlertDialogHeader: passthrough,
    AlertDialogFooter: passthrough,
    AlertDialogTitle: passthrough,
    AlertDialogDescription: passthrough,
    AlertDialogCancel: () => null,
    AlertDialogAction: ({ onClick, children }) =>
      createElement(
        'button',
        { type: 'button', 'data-testid': 'confirm-delete', onClick },
        children
      ),
  }
})
// Tag inputs are identified by their placeholder.
vi.mock('@/components/forms/TagInput', () => ({
  default: (props) => {
    fields.tags[props.placeholder] = props
    return null
  },
}))

import EventForm from '@/components/forms/EventForm'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en
const NOW = new Date(2024, 5, 15, 12, 0, 0)

let container
let root

function render(props = {}) {
  const onSave = vi.fn()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<EventForm onSave={onSave} onCancel={() => {}} t={t} {...props} />)
  })
  return onSave
}

const place = () => fields.tags[t.eventPlacePlaceholder]
const situation = () => fields.tags[t.eventSituationPlaceholder]
const setPlace = (value) => act(() => place().onChange(value))
const setSituation = (value) => act(() => situation().onChange(value))
const setDate = (value) => act(() => fields.date.onChange(value))
const setScore = (value) => act(() => fields.select.onValueChange(value))
const textareas = () => [...container.querySelectorAll('textarea')]

function typeInto(textarea, text) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
  act(() => {
    setValue.call(textarea, text)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function submit() {
  act(() => {
    container
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

function clickButton(label) {
  const button = [...container.querySelectorAll('button')].find(
    (item) => item.textContent === label
  )
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

function fillRequired() {
  setPlace('Park')
  setSituation('Date')
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  fields.select = null
  fields.date = null
  fields.tags = {}
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

describe('EventForm — new event', () => {
  it('starts on today with no score', () => {
    render()
    expect(fields.date.value).toBe(todayString())
    expect(fields.select.value).toBe('none')
  })

  it('saves a minimal event with empty optional fields and no score', () => {
    const onSave = render()
    fillRequired()
    submit()
    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave).toHaveBeenCalledWith({
      date: todayString(),
      details: '',
      score: null,
      place: 'Park',
      situation: 'Date',
      observations: '',
    })
  })

  it('trims every text field', () => {
    const onSave = render()
    setPlace('  Park ')
    setSituation(' Date  ')
    typeInto(textareas()[0], '  nice evening ')
    typeInto(textareas()[1], ' rainy  ')
    submit()
    expect(onSave.mock.calls[0][0]).toMatchObject({
      place: 'Park',
      situation: 'Date',
      details: 'nice evening',
      observations: 'rainy',
    })
  })

  it.each(SCORE_OPTIONS)('saves the selected score %i as a number', (score) => {
    const onSave = render()
    fillRequired()
    setScore(String(score))
    submit()
    expect(onSave.mock.calls[0][0].score).toBe(score)
  })

  it('offers "none" plus every score option', () => {
    render()
    const values = [...container.querySelectorAll('li')].map((item) => item.dataset.value)
    expect(values).toEqual(['none', ...SCORE_OPTIONS.map(String)])
  })

  it('clears the score when "none" is picked again', () => {
    const onSave = render()
    fillRequired()
    setScore('4')
    setScore('none')
    submit()
    expect(onSave.mock.calls[0][0].score).toBeNull()
  })
})

describe('EventForm — validation', () => {
  it('requires a place and a situation', () => {
    const onSave = render()
    submit()
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).toContain(t.requiredPlace)
    expect(container.textContent).toContain(t.requiredSituation)
  })

  it('treats blank text as missing', () => {
    const onSave = render()
    setPlace('   ')
    setSituation('Date')
    submit()
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).toContain(t.requiredPlace)
    expect(container.textContent).not.toContain(t.requiredSituation)
  })

  it.each(['', 'yesterday', '2024.13.01', '2024.02.30'])(
    'rejects the invalid date "%s"',
    (date) => {
      const onSave = render()
      fillRequired()
      setDate(date)
      submit()
      expect(onSave).not.toHaveBeenCalled()
      expect(container.textContent).toContain(t.validDateMsg)
    }
  )

  it('rejects a date in the future', () => {
    const onSave = render()
    fillRequired()
    setDate('2024.06.16')
    submit()
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).toContain(t.futureDateMsg)
    expect(container.textContent).not.toContain(t.validDateMsg)
  })

  it('accepts a past date', () => {
    const onSave = render()
    fillRequired()
    setDate('2020.02.29')
    submit()
    expect(onSave.mock.calls[0][0].date).toBe('2020.02.29')
  })

  it('clears the errors once the form is valid', () => {
    const onSave = render()
    submit()
    fillRequired()
    submit()
    expect(onSave).toHaveBeenCalledOnce()
    expect(container.textContent).not.toContain(t.requiredPlace)
    expect(container.textContent).not.toContain(t.requiredSituation)
  })
})

describe('EventForm — editing an event', () => {
  const existing = {
    id: 'e1',
    date: '2023.04.05',
    details: 'dinner',
    score: 3,
    place: 'Bar',
    situation: 'Night out',
    observations: 'late',
  }

  it('saves an untouched event unchanged, without its id', () => {
    const onSave = render({ initialValues: existing })
    submit()
    const { id: _id, ...expected } = existing
    expect(onSave).toHaveBeenCalledWith(expected)
  })

  it('keeps a score of zero', () => {
    const onSave = render({ initialValues: { ...existing, score: 0 } })
    expect(fields.select.value).toBe('0')
    submit()
    expect(onSave.mock.calls[0][0].score).toBe(0)
  })

  it.each([[null], [undefined], [9], ['3'], [2.5]])(
    'treats the stored score %o as no score',
    (score) => {
      const onSave = render({ initialValues: { ...existing, score } })
      expect(fields.select.value).toBe('none')
      submit()
      expect(onSave.mock.calls[0][0].score).toBeNull()
    }
  )

  it('falls back to today when the stored event has no date', () => {
    render({ initialValues: { ...existing, date: '' } })
    expect(fields.date.value).toBe(todayString())
  })
})

describe('EventForm — actions and wiring', () => {
  it('cancels without saving', () => {
    const onCancel = vi.fn()
    const onSave = render({ onCancel })
    clickButton(t.cancel)
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('has no delete action for a new event', () => {
    render()
    expect(container.textContent).not.toContain(t.deleteEvent)
    expect(container.querySelector('[data-testid="confirm-delete"]')).toBeNull()
  })

  it('deletes only from the confirmation action', () => {
    const onDelete = vi.fn()
    render({ onDelete })
    clickButton(t.deleteEvent)
    expect(onDelete).not.toHaveBeenCalled()
    clickButton(t.deleteEventConfirmAction)
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('gives each tag input its own suggestions and add handler', () => {
    const onAddPlaceTag = vi.fn()
    const onAddSituationTag = vi.fn()
    render({
      placeTags: ['Park'],
      situationTags: ['Date'],
      onAddPlaceTag,
      onAddSituationTag,
      isParentOpen: false,
    })
    expect(place().tags).toEqual(['Park'])
    expect(place().onAddTag).toBe(onAddPlaceTag)
    expect(situation().tags).toEqual(['Date'])
    expect(situation().onAddTag).toBe(onAddSituationTag)
    expect(place().isParentOpen).toBe(false)
    expect(situation().isParentOpen).toBe(false)
  })

  it('defaults to no tag suggestions', () => {
    render()
    expect(place().tags).toEqual([])
    expect(situation().tags).toEqual([])
  })
})

describe('EventForm — skip action and tags hint', () => {
  const labels = () => [...container.querySelectorAll('button')].map((item) => item.textContent)

  it('has no skip button and no hint by default', () => {
    render()
    expect(labels()).toEqual([t.saveEvent, t.cancel])
    expect(container.querySelector('[role="note"]')).toBeNull()
  })

  it('has no cancel button unless it can be cancelled', () => {
    render({ onCancel: undefined })
    expect(labels()).toEqual([t.saveEvent])
  })

  it('skips with the current values, without validating or saving', () => {
    const onSkip = vi.fn()
    const onSave = render({ onSkip, skipLabel: 'Skip' })
    setPlace('Park')
    setScore('3')
    typeInto(textareas()[0], 'walk')
    clickButton('Skip')
    expect(onSkip).toHaveBeenCalledOnce()
    expect(onSkip).toHaveBeenCalledWith({
      date: '2024.06.15',
      details: 'walk',
      score: '3',
      place: 'Park',
      situation: '',
      observations: '',
    })
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).not.toContain(t.requiredSituation)
  })

  it('shows the tags hint as a note', () => {
    render({ tagsHint: 'About the tags' })
    expect(container.querySelector('[role="note"]').textContent).toBe('About the tags')
  })
})
