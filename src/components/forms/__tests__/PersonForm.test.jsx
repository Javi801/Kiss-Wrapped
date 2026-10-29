// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY, GENDERS, ZODIAC_OPTIONS } from '@/lib/constants'
import { LIMITS } from '@/lib/config'

// Selects in render order (gender, zodiac, activity), the how-we-met tag input and the
// nationality tag input (the only one with a placeholder).
const fields = vi.hoisted(() => ({ selects: [], tagInput: null, nationalityInput: null }))

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/forms/TagInput', () => ({
  default: (props) => {
    if (props.placeholder) fields.nationalityInput = props
    else fields.tagInput = props
    return null
  },
}))
vi.mock('@/components/ui/date-picker', () => ({ DatePicker: () => null }))
vi.mock('@/components/ui/select', async () => {
  const { createElement } = await import('react')
  return {
    Select: (props) => {
      fields.selects.push(props)
      return createElement('ul', null, props.children)
    },
    SelectTrigger: () => null,
    SelectValue: () => null,
    SelectContent: ({ children }) => children,
    SelectItem: ({ value, children }) => createElement('li', { 'data-value': value }, children),
  }
})

import PersonForm from '@/components/forms/PersonForm'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en
// Mid-June: Aquarius has already ended this year, Gemini is running, Scorpio is still ahead.
const NOW = new Date(2024, 5, 15, 12, 0, 0)
const sign = (emoji, language = 'en') =>
  ZODIAC_OPTIONS[language].find((option) => option.startsWith(emoji))
const AQUARIUS = sign('♒')
const GEMINI = sign('♊')
const SCORPIO = sign('♏')

let container
let root

function render(props = {}) {
  const onSave = vi.fn()
  fields.selects = []
  fields.tagInput = null
  fields.nationalityInput = null
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<PersonForm onSave={onSave} t={t} language="en" {...props} />)
  })
  return onSave
}

const gender = () => fields.selects.at(-3)
const zodiac = () => fields.selects.at(-2)
const activity = () => fields.selects.at(-1)
const nameInput = () => container.querySelector('input:not([type="number"])')
const ageInput = () => container.querySelector('input[type="number"]')
const textarea = () => container.querySelector('textarea')
const optionLabels = (index) =>
  [...container.querySelectorAll('ul')[index].querySelectorAll('li')].map(
    (item) => item.textContent
  )

function type(element, text) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
  const setValue = Object.getOwnPropertyDescriptor(prototype, 'value').set
  act(() => {
    setValue.call(element, text)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function submit() {
  act(() => {
    container
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

const press = (label) =>
  act(() => {
    ;[...container.querySelectorAll('button')].find((item) => item.textContent === label).click()
  })

// Fills every required field of a new person.
function fill({ age = '30', zodiacSign = AQUARIUS } = {}) {
  type(nameInput(), 'Mia')
  type(ageInput(), age)
  act(() => gender().onValueChange('female'))
  act(() => zodiac().onValueChange(zodiacSign))
  act(() => activity().onValueChange('works'))
  if (fields.tagInput) act(() => fields.tagInput.onChange('School'))
}

const saved = (onSave) => onSave.mock.calls[0][0]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

describe('PersonForm — required fields', () => {
  it('reports every missing field of an empty form', () => {
    const onSave = render()
    submit()
    expect(onSave).not.toHaveBeenCalled()
    for (const message of [
      t.requiredName,
      t.requiredAge,
      t.requiredGender,
      t.requiredHowWeMet,
      t.requiredZodiac,
      t.requiredActivity,
    ]) {
      expect(container.textContent).toContain(message)
    }
  })

  it('does not ask how we met when that field is left out', () => {
    render({ includeHowWeMet: false })
    expect(fields.tagInput).toBeNull()
    submit()
    expect(container.textContent).not.toContain(t.requiredHowWeMet)
  })

  it('treats a blank name as missing', () => {
    const onSave = render()
    fill()
    type(nameInput(), '   ')
    submit()
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).toContain(t.requiredName)
  })

  it('clears the errors once the form is valid', () => {
    const onSave = render()
    submit()
    fill()
    submit()
    expect(onSave).toHaveBeenCalledOnce()
    expect(container.textContent).not.toContain(t.requiredName)
    expect(container.textContent).not.toContain(t.requiredZodiac)
  })
})

describe('PersonForm — age', () => {
  it.each(['0', '-3', '2.5', String(LIMITS.maxAge + 1)])('rejects the age %s', (age) => {
    const onSave = render()
    fill({ age })
    submit()
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).toContain(t.validAge)
  })

  it.each(['1', String(LIMITS.maxAge)])('accepts the age %s', (age) => {
    const onSave = render()
    fill({ age })
    submit()
    expect(onSave).toHaveBeenCalledOnce()
  })

  it('stores a birth year instead of the age', () => {
    const onSave = render()
    fill()
    submit()
    expect(saved(onSave)).not.toHaveProperty('age')
    expect(saved(onSave).birthYear).toBe(1994)
  })

  it('counts one year more back when the sign has not arrived yet this year', () => {
    const onSave = render()
    fill({ zodiacSign: SCORPIO })
    submit()
    expect(saved(onSave).birthYear).toBe(1993)
  })
})

describe('PersonForm — birthday during the current sign', () => {
  it('asks about the birthday only while the chosen sign is running', () => {
    render()
    expect(container.textContent).not.toContain(t.birthdayYes)
    act(() => zodiac().onValueChange(GEMINI))
    expect(container.textContent).toContain(t.birthdayYes)
    act(() => zodiac().onValueChange(AQUARIUS))
    expect(container.textContent).not.toContain(t.birthdayYes)
  })

  it('words the question for the user in add mode and in third person otherwise', () => {
    render({ mode: 'add' })
    act(() => zodiac().onValueChange(GEMINI))
    expect(container.textContent).toContain(t.birthdayAlreadyHappened)

    act(() => root.unmount())
    container.remove()
    render()
    act(() => zodiac().onValueChange(GEMINI))
    expect(container.textContent).toContain(t.birthdayAlreadyHappenedThird)
  })

  it('marks the chosen birthday answer as pressed', () => {
    render()
    act(() => zodiac().onValueChange(GEMINI))
    const pressed = () => container.querySelector('button[aria-pressed="true"]').textContent
    expect(pressed()).toBe(t.birthdayNo)
    press(t.birthdayYes)
    expect(pressed()).toBe(t.birthdayYes)
  })

  it('assumes the birthday is still ahead', () => {
    const onSave = render()
    fill({ zodiacSign: GEMINI })
    submit()
    expect(saved(onSave)).toMatchObject({ birthYear: 1993, birthdayAlreadyHappened: false })
  })

  it('uses this year when the birthday already happened', () => {
    const onSave = render()
    fill({ zodiacSign: GEMINI })
    press(t.birthdayYes)
    submit()
    expect(saved(onSave)).toMatchObject({ birthYear: 1994, birthdayAlreadyHappened: true })
  })

  it('lets the answer be changed back to no', () => {
    const onSave = render()
    fill({ zodiacSign: GEMINI })
    press(t.birthdayYes)
    press(t.birthdayNo)
    submit()
    expect(saved(onSave)).toMatchObject({ birthYear: 1993, birthdayAlreadyHappened: false })
  })

  it('forgets the answer when the sign changes', () => {
    const onSave = render()
    fill({ zodiacSign: GEMINI })
    press(t.birthdayYes)
    act(() => zodiac().onValueChange(GEMINI))
    submit()
    expect(saved(onSave)).toMatchObject({ birthYear: 1993, birthdayAlreadyHappened: false })
  })

  it('keeps the stored answer when the sign is not running', () => {
    const onSave = render({
      initialValues: {
        id: 'mia',
        name: 'Mia',
        birthYear: 1994,
        gender: 'female',
        zodiacSign: AQUARIUS,
        activity: 'works',
        howWeMet: 'School',
        birthdayAlreadyHappened: true,
      },
    })
    submit()
    expect(saved(onSave).birthdayAlreadyHappened).toBe(true)
  })
})

describe('PersonForm — saving a new person', () => {
  it('saves the normalized values', () => {
    const onSave = render()
    fill()
    type(nameInput(), '  Mia  ')
    act(() => fields.tagInput.onChange('  School '))
    type(textarea(), '  nurse ')
    submit()
    expect(saved(onSave)).toEqual({
      name: 'Mia',
      realName: '',
      nationality: '',
      gender: 'female',
      howWeMet: 'School',
      zodiacSign: AQUARIUS,
      activity: 'works',
      detail: 'nurse',
      birthYear: 1994,
      birthdayAlreadyHappened: false,
      partnerStatus: 'never',
      partnerFrom: '',
      partnerTo: '',
    })
  })

  it('saves the real name only when that field is shown', () => {
    const onSave = render({ includeRealName: true })
    fill()
    const realName = container.querySelectorAll('input:not([type="number"])')[1]
    type(realName, '  Maria Soto ')
    submit()
    expect(saved(onSave).realName).toBe('Maria Soto')
  })

  it('has no real name field by default', () => {
    render()
    expect(container.querySelectorAll('input:not([type="number"])')).toHaveLength(1)
  })

  it('saves the trimmed nationality only when that field is shown', () => {
    const onSave = render({ includeNationality: true })
    fill()
    act(() => fields.nationalityInput.onChange('  Chilean '))
    submit()
    expect(saved(onSave).nationality).toBe('Chilean')
  })

  it('has no nationality field by default', () => {
    render()
    expect(fields.nationalityInput).toBeNull()
  })

  it('offers the nationality tags and lets the user add one', () => {
    const onAddNationalityTag = vi.fn()
    render({ includeNationality: true, nationalityTags: ['Chilean'], onAddNationalityTag })
    expect(fields.nationalityInput).toMatchObject({
      tags: ['Chilean'],
      onAddTag: onAddNationalityTag,
      maxLength: LIMITS.nationalityLength,
      placeholder: t.nationalityPlaceholder,
      addTagLabel: t.addTag,
    })
  })

  it('offers no nationality tags when none are passed', () => {
    render({ includeNationality: true })
    expect(fields.nationalityInput.tags).toEqual([])
  })
})

describe('PersonForm — editing a person', () => {
  const existing = {
    id: 'mia',
    name: 'Mia',
    realName: 'Maria',
    birthYear: 1994,
    gender: 'female',
    zodiacSign: AQUARIUS,
    activity: 'studies',
    detail: 'law',
    howWeMet: 'School',
    events: [{ id: 'e1', date: '2024.01.01' }],
  }

  it('shows the current values, with the age derived from the birth year', () => {
    render({ initialValues: existing })
    expect(nameInput().value).toBe('Mia')
    expect(ageInput().value).toBe('30')
    expect(gender().value).toBe('female')
    expect(zodiac().value).toBe(AQUARIUS)
    expect(activity().value).toBe('studies')
    expect(textarea().value).toBe('law')
    expect(fields.tagInput.value).toBe('School')
  })

  it('shows the stored age of a legacy record without a birth year', () => {
    render({ initialValues: { ...existing, birthYear: undefined, age: 41 } })
    expect(ageInput().value).toBe('41')
  })

  it('shows a sign stored in another language in the current one', () => {
    render({ initialValues: { ...existing, zodiacSign: sign('♒', 'es') } })
    expect(zodiac().value).toBe(AQUARIUS)
  })

  it('saves an untouched person without losing its id or events', () => {
    const onSave = render({ initialValues: existing })
    submit()
    expect(saved(onSave)).toMatchObject({
      id: 'mia',
      events: existing.events,
      name: 'Mia',
      birthYear: 1994,
      detail: 'law',
    })
  })

  it('keeps the hidden real name and how-we-met untouched', () => {
    const onSave = render({ initialValues: existing, includeHowWeMet: false })
    submit()
    expect(saved(onSave)).toMatchObject({ realName: 'Maria', howWeMet: 'School' })
  })

  it('tolerates a record without the optional texts', () => {
    const { realName: _r, howWeMet: _h, detail: _d, ...bare } = existing
    const onSave = render({ initialValues: bare, includeHowWeMet: false })
    submit()
    expect(saved(onSave)).toMatchObject({ realName: '', howWeMet: '', detail: '' })
  })

  it('shows the current nationality', () => {
    render({ initialValues: { ...existing, nationality: 'Chilean' }, includeNationality: true })
    expect(fields.nationalityInput.value).toBe('Chilean')
  })

  it('keeps the hidden nationality untouched', () => {
    const onSave = render({ initialValues: { ...existing, nationality: 'Chilean' } })
    submit()
    expect(saved(onSave).nationality).toBe('Chilean')
  })

  it('saves an empty nationality for a record without one', () => {
    const onSave = render({ initialValues: existing, includeNationality: true })
    submit()
    expect(saved(onSave).nationality).toBe('')
  })
})

describe('PersonForm — options and labels', () => {
  it('offers every gender, translated', () => {
    render()
    expect(optionLabels(0)).toHaveLength(GENDERS.length)
    expect(optionLabels(0)).toContain(t.female)
  })

  it.each(['en', 'es'])('offers the twelve signs in %s', (language) => {
    render({ language })
    expect(optionLabels(1)).toEqual(ZODIAC_OPTIONS[language])
  })

  it('words the activities for the user in add mode', () => {
    render({ mode: 'add' })
    expect(optionLabels(2)).toEqual([t.studiesForm, t.worksForm, t.studiesWorksForm, t.other])
  })

  it('words the activities in third person otherwise', () => {
    render()
    expect(optionLabels(2)).toEqual([t.studies, t.works, t.studiesWorks, t.other])
  })

  it('asks for the activity detail only after an activity is chosen', () => {
    render()
    expect(textarea()).toBeNull()
    act(() => activity().onValueChange('studies'))
    expect(textarea()).not.toBeNull()
  })

  it.each([
    ['studies', t.specificStudies],
    ['works', t.specificWorks],
    ['studies and works', t.specificStudiesWorks],
    ['other', ''],
  ])('hints what to write for "%s"', (value, placeholder) => {
    render()
    act(() => activity().onValueChange(value))
    expect(textarea().placeholder).toBe(placeholder)
  })

  it('passes the how-we-met tags and add handler to the tag input', () => {
    const onAddHowWeMetTag = vi.fn()
    render({ howWeMetTags: ['School'], onAddHowWeMetTag, isParentOpen: false })
    expect(fields.tagInput).toMatchObject({
      tags: ['School'],
      onAddTag: onAddHowWeMetTag,
      isParentOpen: false,
    })
  })
})

describe('PersonForm — actions', () => {
  const labels = () => [...container.querySelectorAll('button')].map((item) => item.textContent)

  it('uses the default save label', () => {
    render()
    expect(labels()).toContain(t.savePerson)
  })

  it('uses a custom save label', () => {
    render({ saveLabel: 'Save and go back' })
    expect(labels()).toContain('Save and go back')
    expect(labels()).not.toContain(t.savePerson)
  })

  it('has no cancel button unless it can be cancelled', () => {
    render()
    expect(labels()).not.toContain(t.cancel)
  })

  it('cancels without saving', () => {
    const onCancel = vi.fn()
    const onSave = render({ onCancel })
    press(t.cancel)
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('has no skip button unless it can be skipped', () => {
    render()
    expect(labels()).toEqual([t.savePerson])
  })

  it('skips with the current values, without validating or saving', () => {
    const onSkip = vi.fn()
    const onSave = render({ onSkip, skipLabel: 'Skip' })
    type(nameInput(), 'Mia')
    press('Skip')
    expect(onSkip).toHaveBeenCalledOnce()
    expect(onSkip.mock.calls[0][0]).toMatchObject({
      name: 'Mia',
      age: '',
      gender: '',
      zodiacSign: '',
      birthdayAlreadyHappened: false,
    })
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).not.toContain(t.requiredAge)
  })

  it('skips with the birthday answer of a running sign', () => {
    const onSkip = vi.fn()
    render({ onSkip, skipLabel: 'Skip' })
    act(() => zodiac().onValueChange(GEMINI))
    press(t.birthdayYes)
    press('Skip')
    expect(onSkip.mock.calls[0][0].birthdayAlreadyHappened).toBe(true)
  })

  it('drops the birthday answer when the sign is no longer the running one', () => {
    const onSkip = vi.fn()
    render({ onSkip, skipLabel: 'Skip' })
    act(() => zodiac().onValueChange(GEMINI))
    press(t.birthdayYes)
    act(() => zodiac().onValueChange(SCORPIO))
    press('Skip')
    expect(onSkip.mock.calls[0][0].birthdayAlreadyHappened).toBe(false)
  })
})

describe('PersonForm — zodiac hint', () => {
  it('has no hint by default', () => {
    render()
    expect(container.querySelector('[role="note"]')).toBeNull()
  })

  it('shows the hint as a note', () => {
    render({ zodiacHint: 'About the sign' })
    expect(container.querySelector('[role="note"]').textContent).toBe('About the sign')
  })
})
