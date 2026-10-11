import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Input } from '@/components/ui/input'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

const GAP = 4
const MARGIN = 8
const MAX_H = 240
// Room a side needs to keep the dropdown; below it the other side is considered.
const MIN_ROOM = 160
// Differences below this (in px) are ignored so the per-frame loop doesn't re-render.
const EPSILON = 0.5

const nudge = (current, delta) => (Math.abs(delta) < EPSILON ? current : current + delta)

const stopPropagation = (e) => e.stopPropagation()

function isSamePosition(a, b) {
  if (!a || !b) return a === b
  return (
    a.placement === b.placement &&
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.maxHeight === b.maxHeight &&
    a.ready === b.ready
  )
}

function Option({ onSelect, style, children }) {
  return (
    <button
      type="button"
      // Keeps focus on the input, so onBlur doesn't close the list before the click lands.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '0.5rem 0.75rem',
        ...TEXT.body,
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export default function TagInput({
  value,
  onChange,
  tags,
  onAddTag,
  placeholder,
  maxLength,
  style,
  addTagLabel,
  isParentOpen,
}) {
  const PALETTE = usePalette()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const containerRef = useRef(null)
  const dropdownRef = useRef(null)
  const placementRef = useRef(null)
  // Mirror of `pos` so the per-frame loop can read the last applied position
  // without depending on render timing.
  const posRef = useRef(null)

  const trimmed = value.trim()
  const filtered = tags.filter(
    (tag) => !trimmed || tag.toLowerCase().includes(trimmed.toLowerCase())
  )
  const showAddOption =
    trimmed && onAddTag && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())
  const effectiveOpen = isParentOpen === false ? false : open
  const showDropdown = effectiveOpen && pos && (filtered.length > 0 || showAddOption)

  const commit = useCallback((next) => {
    posRef.current = next
    setPos(next)
  }, [])

  const closeDropdown = useCallback(() => {
    placementRef.current = null
    commit(null)
    setOpen(false)
  }, [commit])

  // Where the dropdown SHOULD be (from the input's rect), corrected by how far the
  // rendered dropdown actually is from that. The dialog (transforms, scroll lock)
  // can shift `position: fixed` coordinates, so we trust measurements, not math.
  const computePosition = useCallback(() => {
    if (!containerRef.current) return null

    const anchor = containerRef.current.getBoundingClientRect()
    const vv = window.visualViewport
    const offsetTop = vv?.offsetTop ?? 0
    const viewportHeight = vv?.height ?? window.innerHeight

    // Visible-area coordinates (keyboard excluded). Only used to measure free space.
    const visibleTop = anchor.top - offsetTop
    const visibleBottom = anchor.bottom - offsetTop
    if (visibleBottom < 0 || visibleTop > viewportHeight) return null

    const spaceBelow = viewportHeight - visibleBottom - GAP - MARGIN
    const spaceAbove = visibleTop - GAP - MARGIN

    // The side is kept while it has room, so the dropdown doesn't flip while
    // scrolling, and picked again once it runs out (e.g. the keyboard covers it).
    const room = placementRef.current === 'up' ? spaceAbove : spaceBelow
    if (!placementRef.current || room < MIN_ROOM) {
      placementRef.current = spaceBelow < MIN_ROOM && spaceAbove > spaceBelow ? 'up' : 'down'
    }
    const placement = placementRef.current
    const maxHeight = Math.max(0, Math.min(placement === 'up' ? spaceAbove : spaceBelow, MAX_H))

    const el = dropdownRef.current
    const applied = posRef.current
    const rendered = el?.getBoundingClientRect()

    const desiredTop =
      placement === 'up'
        ? anchor.top - GAP - Math.min(rendered?.height ?? 0, maxHeight)
        : anchor.bottom + GAP
    const desiredLeft = anchor.left

    // Until the dropdown has rendered once there is nothing to measure, so it
    // stays hidden for a frame and is then shown already corrected.
    const ready = !!rendered && !!applied

    return {
      placement,
      top: ready ? nudge(applied.top, desiredTop - rendered.top) : desiredTop,
      left: ready ? nudge(applied.left, desiredLeft - rendered.left) : desiredLeft,
      width: anchor.width,
      maxHeight,
      ready,
    }
  }, [])

  function openDropdown() {
    placementRef.current = null
    posRef.current = null
    commit(computePosition())
    setOpen(true)
  }

  useEffect(() => {
    if (!effectiveOpen) return

    function closeIfOutside(e) {
      if (!containerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        closeDropdown()
      }
    }

    // A null position means the input is momentarily out of the visible area
    // (e.g. the keyboard is moving): hide the dropdown but keep it open, so it
    // shows up again by itself.
    function reposition() {
      const next = computePosition()
      if (!isSamePosition(posRef.current, next)) commit(next)
    }

    // The input can move with no scroll or resize event at all (a transition or a
    // layout change in the parent dialog), so it is also checked on every frame.
    let frame = requestAnimationFrame(function follow() {
      reposition()
      frame = requestAnimationFrame(follow)
    })

    document.addEventListener('pointerdown', closeIfOutside)
    window.addEventListener('resize', reposition)
    window.visualViewport?.addEventListener('resize', reposition)
    window.visualViewport?.addEventListener('scroll', reposition)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('pointerdown', closeIfOutside)
      window.removeEventListener('resize', reposition)
      window.visualViewport?.removeEventListener('resize', reposition)
      window.visualViewport?.removeEventListener('scroll', reposition)
    }
  }, [effectiveOpen, computePosition, closeDropdown, commit])

  function selectTag(tag) {
    onChange(tag)
    closeDropdown()
  }

  function handleAddTag() {
    if (!trimmed) return
    onAddTag?.(trimmed)
    onChange(trimmed)
    closeDropdown()
  }

  return (
    <div ref={containerRef}>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={openDropdown}
        onBlur={closeDropdown}
        onKeyDown={(e) => {
          if (e.key === 'Escape') closeDropdown()
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        className="rounded-2xl"
        style={style}
      />

      {showDropdown &&
        createPortal(
          <div
            ref={dropdownRef}
            // The dropdown lives outside the Radix dialog, so its scroll lock and
            // outside-press handling would otherwise swallow these gestures.
            onWheel={stopPropagation}
            onTouchMove={stopPropagation}
            onPointerDown={stopPropagation}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
              visibility: pos.ready ? 'visible' : 'hidden',
              zIndex: 9999,
              borderRadius: '0.75rem',
              border: `1px solid ${PALETTE.inputBorder}`,
              backgroundColor: PALETTE.card,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              pointerEvents: 'auto',
            }}
          >
            {filtered.map((tag, i) => {
              const selected = value.toLowerCase() === tag.toLowerCase()
              return (
                <Option
                  key={tag}
                  onSelect={() => selectTag(tag)}
                  style={{
                    color: selected ? PALETTE.accent : PALETTE.text,
                    backgroundColor: selected ? PALETTE.accentMuted : 'transparent',
                    fontWeight: selected ? '600' : '400',
                    borderTop: i > 0 ? `1px solid ${PALETTE.inputBorder}` : 'none',
                  }}
                >
                  {tag}
                </Option>
              )
            })}
            {showAddOption && (
              <Option
                onSelect={handleAddTag}
                style={{
                  color: PALETTE.accent,
                  fontWeight: '500',
                  borderTop: filtered.length > 0 ? `1px solid ${PALETTE.inputBorder}` : 'none',
                }}
              >
                {`+ ${addTagLabel} "${trimmed}"`}
              </Option>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}