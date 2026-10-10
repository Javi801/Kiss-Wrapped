// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { setInertExcept } from '@/lib/inert'

let root

function mount(html) {
  root = document.createElement('div')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

const inertIds = () => [...root.querySelectorAll('[inert]')].map((node) => node.id)

afterEach(() => {
  root.remove()
})

describe('setInertExcept', () => {
  it('makes every child inert when nothing is kept', () => {
    mount('<p id="a"></p><div id="b"><button id="c"></button></div>')
    setInertExcept(root, '.keep')
    expect(inertIds()).toEqual(['a', 'b'])
  })

  it('keeps a matching element and the path to it, and nothing else', () => {
    mount(`
      <header id="top"></header>
      <main id="main">
        <nav id="nav"><button id="x"></button></nav>
        <section id="card">
          <button id="edit"></button>
          <button id="add" class="keep"><svg id="icon"></svg></button>
          <button id="delete"></button>
        </section>
      </main>
    `)
    setInertExcept(root, '.keep')
    expect(inertIds()).toEqual(['top', 'nav', 'edit', 'delete'])
  })

  it('keeps several elements in different branches', () => {
    mount(`
      <div id="one"><p id="note" class="keep"></p><button id="b1"></button></div>
      <div id="two"><button id="b2"></button></div>
      <div id="three"><button id="b3" class="keep"></button></div>
    `)
    setInertExcept(root, '.keep')
    expect(inertIds()).toEqual(['b1', 'two'])
  })

  it('never marks the root itself', () => {
    mount('<p id="a"></p>')
    setInertExcept(root, '.keep')
    expect(root.hasAttribute('inert')).toBe(false)
  })

  it('undoes only what it marked', () => {
    mount('<p id="a"></p><p id="b" inert></p><p id="c" class="keep"></p>')
    const undo = setInertExcept(root, '.keep')
    expect(inertIds()).toEqual(['a', 'b'])
    undo()
    expect(inertIds()).toEqual(['b'])
  })
})
