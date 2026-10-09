// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY, ZODIAC_OPTIONS } from '@/lib/constants'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/forms/TagInput', () => ({ default: () => null }))
vi.mock('@/components/ui/select', () => ({
  Select: () => null,
  SelectContent: () => null,
  SelectItem: () => null,
  SelectTrigger: () => null,
  SelectValue: () => null,
}))
// The form only uses the date picker for the partner period.
vi.mock('@/components/ui/date-picker', async () => {
  const { createElement } = await import('react')
  return {
    DatePicker: ({ value }) =>
      createElement('input', { 'data-testid': 'partner-date', readOnly: true, value }),
  }
})

import PersonForm from '@/components/forms/PersonForm'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en
const FUTURE_DATE = '2999.01.01'

// A person that passes every non-partner validation.
const validPerson = {
  id: 'mia',
  name: 'Mia',
  age: 30,
  gender: 'female',
  zodiacSign: ZODIAC_OPTIONS.en[0],
  activity: 'works',
  howWeMet: 'Party',
}

let container
let root

function renderForm(partner) {
  const onSave = vi.fn()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <PersonForm
        initialValues={{ ...validPerson, ...partner }}
        onSave={onSave}
        t={t}
        language="en"
        includeHowWeMet={false}
      />
    )
  })
  return onSave
}

function submit() {
  act(() => {
    container
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

function clickStatus(label) {
  const button = [...container.querySelectorAll('button[type="button"]')].find(
    (item) => item.textContent === label
  )
  act(() => button.click())
}

const dateInputs = () => container.querySelectorAll('[data-testid="partner-date"]')
const savedPartner = (onSave) => {
  const { partnerStatus, partnerFrom, partnerTo } = onSave.mock.calls[0][0]
  return { partnerStatus, partnerFrom, partnerTo }
}

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('PersonForm — partner fields', () => {
  it('shows no date fields when the person was never a partner', () => {
    renderForm({ partnerStatus: 'never' })
    expect(dateInputs()).toHaveLength(0)
    expect(container.textContent).not.toContain(t.partnerHint)
  })

  it('shows only the start date for a current partner', () => {
    renderForm({ partnerStatus: 'current' })
    expect(dateInputs()).toHaveLength(1)
    expect(container.textContent).toContain(t.partnerSince)
    expect(container.textContent).toContain(t.partnerHint)
  })

  it('shows the start and end dates for a past partner', () => {
    renderForm({ partnerStatus: 'past' })
    expect(dateInputs()).toHaveLength(2)
    expect(container.textContent).toContain(t.partnerToLabel)
  })

  it('treats a missing or unknown status as never', () => {
    const onSave = renderForm({ partnerStatus: 'maybe', partnerFrom: '2023.01.01' })
    expect(dateInputs()).toHaveLength(0)
    submit()
    expect(savedPartner(onSave)).toEqual({ partnerStatus: 'never', partnerFrom: '', partnerTo: '' })
  })

  it('switches the visible date fields when the status changes', () => {
    renderForm({ partnerStatus: 'never' })
    clickStatus(t.partnerPast)
    expect(dateInputs()).toHaveLength(2)
    clickStatus(t.partnerCurrent)
    expect(dateInputs()).toHaveLength(1)
    clickStatus(t.partnerNever)
    expect(dateInputs()).toHaveLength(0)
  })
})

describe('PersonForm — partner validation', () => {
  it('saves a current partner without a start date', () => {
    const onSave = renderForm({ partnerStatus: 'current' })
    submit()
    expect(savedPartner(onSave)).toEqual({
      partnerStatus: 'current',
      partnerFrom: '',
      partnerTo: '',
    })
  })

  it('saves a current partner with a valid start date', () => {
    const onSave = renderForm({ partnerStatus: 'current', partnerFrom: ' 2023.01.01 ' })
    submit()
    expect(savedPartner(onSave)).toEqual({
      partnerStatus: 'current',
      partnerFrom: '2023.01.01',
      partnerTo: '',
    })
  })

  it('rejects a malformed start date', () => {
    const onSave = renderForm({ partnerStatus: 'current', partnerFrom: '2023-01-01' })
    submit()
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).toContain(t.validDateMsg)
  })

  it('rejects a start date in the future', () => {
    const onSave = renderForm({ partnerStatus: 'current', partnerFrom: FUTURE_DATE })
    submit()
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).toContain(t.futureDateMsg)
  })

  it('requires the end date of a past partner', () => {
    const onSave = renderForm({ partnerStatus: 'past', partnerFrom: '2023.01.01' })
    submit()
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).toContain(t.requiredPartnerTo)
  })

  it('rejects a malformed end date', () => {
    const onSave = renderForm({ partnerStatus: 'past', partnerTo: '2023.02.30' })
    submit()
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).toContain(t.validDateMsg)
  })

  it('rejects an end date in the future', () => {
    const onSave = renderForm({ partnerStatus: 'past', partnerTo: FUTURE_DATE })
    submit()
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).toContain(t.futureDateMsg)
  })

  it('rejects a start date after the end date', () => {
    const onSave = renderForm({
      partnerStatus: 'past',
      partnerFrom: '2023.12.31',
      partnerTo: '2023.01.01',
    })
    submit()
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).toContain(t.partnerRangeError)
  })

  it('reports an invalid start date instead of the range error', () => {
    const onSave = renderForm({
      partnerStatus: 'past',
      partnerFrom: 'not-a-date',
      partnerTo: '2023.01.01',
    })
    submit()
    expect(onSave).not.toHaveBeenCalled()
    expect(container.textContent).toContain(t.validDateMsg)
    expect(container.textContent).not.toContain(t.partnerRangeError)
  })

  it('saves a past partner whose period starts and ends on the same day', () => {
    const onSave = renderForm({
      partnerStatus: 'past',
      partnerFrom: '2023.06.01',
      partnerTo: '2023.06.01',
    })
    submit()
    expect(savedPartner(onSave)).toEqual({
      partnerStatus: 'past',
      partnerFrom: '2023.06.01',
      partnerTo: '2023.06.01',
    })
  })

  it('saves a past partner without a start date', () => {
    const onSave = renderForm({ partnerStatus: 'past', partnerTo: '2023.12.31' })
    submit()
    expect(savedPartner(onSave)).toEqual({
      partnerStatus: 'past',
      partnerFrom: '',
      partnerTo: '2023.12.31',
    })
  })
})

describe('PersonForm — partner dates on save', () => {
  it('ignores stale dates when the person was never a partner', () => {
    const onSave = renderForm({
      partnerStatus: 'never',
      partnerFrom: 'not-a-date',
      partnerTo: FUTURE_DATE,
    })
    submit()
    expect(savedPartner(onSave)).toEqual({ partnerStatus: 'never', partnerFrom: '', partnerTo: '' })
  })

  it('drops the end date of a current partner', () => {
    const onSave = renderForm({
      partnerStatus: 'current',
      partnerFrom: '2023.01.01',
      partnerTo: '2023.12.31',
    })
    submit()
    expect(savedPartner(onSave)).toEqual({
      partnerStatus: 'current',
      partnerFrom: '2023.01.01',
      partnerTo: '',
    })
  })

  it('clears both dates after switching a past partner to never', () => {
    const onSave = renderForm({
      partnerStatus: 'past',
      partnerFrom: '2023.01.01',
      partnerTo: '2023.12.31',
    })
    clickStatus(t.partnerNever)
    submit()
    expect(savedPartner(onSave)).toEqual({ partnerStatus: 'never', partnerFrom: '', partnerTo: '' })
  })

  it('clears a previous partner error once the status is never', () => {
    const onSave = renderForm({ partnerStatus: 'past' })
    submit()
    expect(container.textContent).toContain(t.requiredPartnerTo)
    clickStatus(t.partnerNever)
    submit()
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
