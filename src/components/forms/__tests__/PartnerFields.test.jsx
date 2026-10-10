// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { COPY } from '@/lib/constants'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))
vi.mock('@/components/ui/date-picker', async () => {
  const { createElement } = await import('react')
  return {
    DatePicker: ({ value, onChange }) =>
      createElement('input', {
        'data-testid': 'partner-date',
        value,
        onChange: (event) => onChange(event.target.value),
      }),
  }
})

import PartnerFields from '@/components/forms/PartnerFields'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = COPY.en

let container
let root

function renderFields(props = {}) {
  const onChange = vi.fn()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <PartnerFields
        status="never"
        partnerFrom=""
        partnerTo=""
        onChange={onChange}
        t={t}
        {...props}
      />
    )
  })
  return onChange
}

const statusButton = (label) =>
  [...container.querySelectorAll('button[type="button"]')].find(
    (item) => item.textContent === label
  )
const pressedLabels = () =>
  [...container.querySelectorAll('button[aria-pressed="true"]')].map((item) => item.textContent)
const dateInputs = () => [...container.querySelectorAll('[data-testid="partner-date"]')]

// Sets the value the way React expects so the change handler fires.
function typeDate(input, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  act(() => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('PartnerFields — render per status', () => {
  it('shows the three statuses and the main label', () => {
    renderFields()
    expect(statusButton(t.partnerNever)).toBeDefined()
    expect(statusButton(t.partnerCurrent)).toBeDefined()
    expect(statusButton(t.partnerPast)).toBeDefined()
    expect(container.textContent).toContain(t.partnerLabel)
  })

  it('shows no dates and no hint for never', () => {
    renderFields({ status: 'never', partnerFrom: '2020.01.01', partnerTo: '2021.01.01' })
    expect(pressedLabels()).toEqual([t.partnerNever])
    expect(dateInputs()).toHaveLength(0)
    expect(container.textContent).not.toContain(t.partnerHint)
  })

  it('shows only the start date for current', () => {
    renderFields({ status: 'current', partnerFrom: '2020.01.01' })
    expect(pressedLabels()).toEqual([t.partnerCurrent])
    expect(dateInputs().map((input) => input.value)).toEqual(['2020.01.01'])
    expect(container.textContent).toContain(t.partnerSince)
    expect(container.textContent).not.toContain(t.partnerToLabel)
    expect(container.textContent).toContain(t.partnerHint)
  })

  it('shows the start and end dates for past', () => {
    renderFields({ status: 'past', partnerFrom: '2020.01.01', partnerTo: '2021.01.01' })
    expect(pressedLabels()).toEqual([t.partnerPast])
    expect(dateInputs().map((input) => input.value)).toEqual(['2020.01.01', '2021.01.01'])
    expect(container.textContent).toContain(t.partnerFromLabel)
    expect(container.textContent).toContain(`${t.partnerToLabel} *`)
  })

  it('selects no status and shows no dates for an unknown status', () => {
    renderFields({ status: '', partnerFrom: '2020.01.01', partnerTo: '2021.01.01' })
    expect(pressedLabels()).toEqual([])
    expect(dateInputs()).toHaveLength(0)
  })

  it('hides the main label and the hint in the compact variant', () => {
    renderFields({ status: 'past', compact: true })
    expect(container.textContent).not.toContain(t.partnerLabel)
    expect(container.textContent).not.toContain(t.partnerHint)
    expect(dateInputs()).toHaveLength(2)
  })
})

describe('PartnerFields — changes', () => {
  it('reports a status change', () => {
    const onChange = renderFields({ status: 'never' })
    act(() => statusButton(t.partnerPast).click())
    expect(onChange).toHaveBeenCalledWith('partnerStatus', 'past')
  })

  it('reports a change of each date', () => {
    const onChange = renderFields({ status: 'past' })
    const [from, to] = dateInputs()
    typeDate(from, '2020.01.01')
    typeDate(to, '2021.01.01')
    expect(onChange).toHaveBeenCalledWith('partnerFrom', '2020.01.01')
    expect(onChange).toHaveBeenCalledWith('partnerTo', '2021.01.01')
  })
})

describe('PartnerFields — errors', () => {
  it('shows no error text by default', () => {
    renderFields({ status: 'past' })
    expect(container.textContent).not.toContain(t.validDateMsg)
    expect(container.textContent).not.toContain(t.requiredPartnerTo)
  })

  it('shows the status error', () => {
    renderFields({ status: '', errors: { status: t.requiredPartnerStatus } })
    expect(container.textContent).toContain(t.requiredPartnerStatus)
  })

  it('shows the error of each date', () => {
    renderFields({
      status: 'past',
      errors: { partnerFrom: t.validDateMsg, partnerTo: t.requiredPartnerTo },
    })
    expect(container.textContent).toContain(t.validDateMsg)
    expect(container.textContent).toContain(t.requiredPartnerTo)
  })

  it('does not show date errors for a status without dates', () => {
    renderFields({
      status: 'never',
      errors: { partnerFrom: t.validDateMsg, partnerTo: t.requiredPartnerTo },
    })
    expect(container.textContent).not.toContain(t.validDateMsg)
    expect(container.textContent).not.toContain(t.requiredPartnerTo)
  })

  it('does not show the end error for a current partner', () => {
    renderFields({ status: 'current', errors: { partnerTo: t.requiredPartnerTo } })
    expect(container.textContent).not.toContain(t.requiredPartnerTo)
  })
})
