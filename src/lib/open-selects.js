// Close callbacks of the selects that are currently open, most recent last.
const openSelects = []

/**
 * Registers the close callback of an open select. Returns the unregister function.
 */
export function registerOpenSelect(close) {
  openSelects.push(close)
  return () => {
    const index = openSelects.lastIndexOf(close)
    if (index !== -1) openSelects.splice(index, 1)
  }
}

/**
 * Closes the most recently opened select. Returns false when none is open.
 */
export function closeTopSelect() {
  const close = openSelects[openSelects.length - 1]
  if (!close) return false
  close()
  return true
}
