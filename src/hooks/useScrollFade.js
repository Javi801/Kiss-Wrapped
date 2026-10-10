import { useCallback } from 'react'

const MAX_FADE_PX = 40

/**
 * Fades the top and bottom edges of a vertical scroll container, each one only
 * while content is hidden past it. Returns a callback ref for the container.
 */
export function useScrollFade() {
  return useCallback((node) => {
    if (!node) return undefined

    const update = () => {
      const hiddenAbove = node.scrollTop
      const hiddenBelow = node.scrollHeight - node.clientHeight - node.scrollTop
      const top = Math.max(0, Math.min(hiddenAbove, MAX_FADE_PX))
      const bottom = Math.max(0, Math.min(hiddenBelow, MAX_FADE_PX))
      const mask =
        top < 1 && bottom < 1
          ? ''
          : `linear-gradient(to bottom, transparent 0, #000 ${top}px, #000 calc(100% - ${bottom}px), transparent 100%)`
      node.style.maskImage = mask
      node.style.webkitMaskImage = mask
    }

    update()
    node.addEventListener('scroll', update, { passive: true })

    // Content can grow or shrink without a scroll event (fields appearing, viewport resize).
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    resizeObserver?.observe(node)
    const mutationObserver =
      typeof MutationObserver === 'undefined' ? null : new MutationObserver(update)
    mutationObserver?.observe(node, { childList: true, subtree: true, characterData: true })

    // React 19 runs the function returned by a callback ref when the node unmounts.
    return () => {
      node.removeEventListener('scroll', update)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [])
}
