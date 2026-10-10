/**
 * Makes every branch under `root` inert, except the elements matching `keepSelector`
 * and the path that leads to them. Inert content cannot be focused, clicked or read
 * by assistive technology. Returns a function that undoes it.
 */
export function setInertExcept(root, keepSelector) {
  const marked = []

  function visit(node) {
    for (const child of node.children) {
      if (child.matches(keepSelector)) continue
      if (child.querySelector(keepSelector)) visit(child)
      else if (!child.hasAttribute('inert')) {
        child.setAttribute('inert', '')
        marked.push(child)
      }
    }
  }

  visit(root)

  return () => {
    for (const node of marked) node.removeAttribute('inert')
  }
}
