import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('@/lib/theme', () => ({ usePalette: () => ({}) }))

import ChartTooltip from '@/components/charts/ChartTooltip'

const tooltipUnit = { one: 'kiss', many: 'kisses' }
const render = (props) =>
  renderToStaticMarkup(<ChartTooltip tooltipUnit={tooltipUnit} {...props} />)

describe('ChartTooltip', () => {
  it('renders nothing while inactive', () => {
    expect(render({ active: false, payload: [{ name: 'Bar', value: 3 }] })).toBe('')
  })

  it.each([[undefined], [null], [[]]])('renders nothing without a payload (%o)', (payload) => {
    expect(render({ active: true, payload })).toBe('')
  })

  it('uses the singular unit for a value of 1', () => {
    const html = render({ active: true, payload: [{ name: 'Bar', value: 1 }] })
    expect(html).toContain('1 kiss<')
  })

  it.each([0, 2, 15])('uses the plural unit for a value of %i', (value) => {
    const html = render({ active: true, payload: [{ name: 'Bar', value }] })
    expect(html).toContain(`${value} kisses<`)
  })

  it('prefers the cartesian label over the slice name', () => {
    const html = render({ active: true, label: 'March', payload: [{ name: 'value', value: 2 }] })
    expect(html).toContain('>March<')
    expect(html).not.toContain('>value<')
  })

  it('falls back to the slice name when there is no label', () => {
    const html = render({ active: true, payload: [{ name: 'Female', value: 2 }] })
    expect(html).toContain('>Female<')
  })

  it('shows only the first payload entry', () => {
    const html = render({
      active: true,
      payload: [
        { name: 'First', value: 2 },
        { name: 'Second', value: 9 },
      ],
    })
    expect(html).toContain('2 kisses')
    expect(html).not.toContain('Second')
    expect(html).not.toContain('9 kisses')
  })
})
