// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))

import ChoiceToggle from '@/components/forms/ChoiceToggle'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const OPTIONS = [
  { value: true, label: 'Yes' },
  { value: false, label: 'Not yet' },
]

let container
let root

function render(props = {}) {
  const onChange = vi.fn()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<ChoiceToggle options={OPTIONS} value={false} onChange={onChange} {...props} />)
  })
  return onChange
}

const buttons = () => [...container.querySelectorAll('button')]
const button = (label) => buttons().find((item) => item.textContent === label)

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('ChoiceToggle', () => {
  it('renders one plain button per option, in order', () => {
    render()
    expect(buttons().map((item) => item.textContent)).toEqual(['Yes', 'Not yet'])
    expect(buttons().every((item) => item.type === 'button')).toBe(true)
  })

  it('marks only the selected option as pressed', () => {
    render({ value: true })
    expect(button('Yes').getAttribute('aria-pressed')).toBe('true')
    expect(button('Not yet').getAttribute('aria-pressed')).toBe('false')
  })

  it('marks no option when the value matches none', () => {
    render({ value: 'other' })
    expect(container.querySelector('[aria-pressed="true"]')).toBeNull()
  })

  it('reports the value of the pressed option, including a falsy one', () => {
    const onChange = render({ value: true })
    act(() => button('Not yet').click())
    expect(onChange).toHaveBeenCalledWith(false)
    act(() => button('Yes').click())
    expect(onChange).toHaveBeenLastCalledWith(true)
  })

  it('works with string values', () => {
    const onChange = render({
      options: [
        { value: 'never', label: 'Never' },
        { value: 'past', label: 'Past' },
      ],
      value: 'past',
    })
    expect(button('Past').getAttribute('aria-pressed')).toBe('true')
    act(() => button('Never').click())
    expect(onChange).toHaveBeenCalledWith('never')
  })
})
