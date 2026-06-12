import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Input } from '@/components/ui/input'
import { TEXT } from '@/lib/constants'
import { usePalette } from '@/lib/theme'

function getViewportMetrics() {
  const visualViewport = window.visualViewport
  return {
    offsetTop: visualViewport?.offsetTop ?? 0,
    offsetLeft: visualViewport?.offsetLeft ?? 0,
    height: visualViewport?.height ?? window.innerHeight,
  }
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

  const trimmed = value.trim()
  const filtered = tags.filter(
    (tag) => !trimmed || tag.toLowerCase().includes(trimmed.toLowerCase())
  )
  const showAddOption =
    trimmed && onAddTag && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())
  const effectiveOpen = isParentOpen === false ? false : open
  const showDropdown = effectiveOpen && pos && (filtered.length > 0 || showAddOption)

  // Anchor rect and viewport metrics must be read in the same synchronous pass:
  // mixing a stale rect with fresh visualViewport offsets (or vice versa) is what
  // makes the dropdown jump while the keyboard hides and the scroll rebounds.
  const computePosition = useCallback(() => {
    if (!containerRef.current) return null
    const anchorRect = containerRef.current.getBoundingClientRect()
    const { offsetTop, offsetLeft, height: vph } = getViewportMetrics()
    const anchorTop = anchorRect.top - offsetTop
    const anchorBottom = anchorRect.bottom - offsetTop
    if (anchorBottom < 0 || anchorTop > vph) return null
    const spaceBelow = vph - anchorBottom - 4
    const spaceAbove = anchorTop - 4
    if (!placementRef.current) {
      placementRef.current = spaceBelow < 160 && spaceAbove > spaceBelow ? 'up' : 'down'
    }
    const placement = placementRef.current
    return {
      placement,
      top: placement === 'up' ? anchorTop - 4 : anchorBottom + 4,
      left: anchorRect.left - offsetLeft,
      width: anchorRect.width,
      maxHeight: Math.max(Math.min(placement === 'up' ? spaceAbove : spaceBelow, 240), 0),
    }
  }, [])

  const closeDropdown = useCallback(() => {
    placementRef.current = null
    setPos(null)
    setOpen(false)
  }, [])

  function handleFocus() {
    placementRef.current = null
    setPos(computePosition())
    setOpen(true)
  }

  function handleChange(e) {
    onChange(e.target.value)
    placementRef.current = null
    setPos(computePosition())
    setOpen(true)
  }

  useEffect(() => {
    if (!effectiveOpen) return

    function closeIfOutside(e) {
      if (!containerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        closeDropdown()
      }
    }

    // Synchronous on purpose: deferring to requestAnimationFrame leaves the
    // dropdown a frame behind the input during the keyboard-hide scroll rebound.
    function reposition() {
      const next = computePosition()
      if (!next) {
        closeDropdown()
      } else {
        setPos(next)
      }
    }

    document.addEventListener('mousedown', closeIfOutside)
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    window.visualViewport?.addEventListener('resize', reposition)
    window.visualViewport?.addEventListener('scroll', reposition)
    return () => {
      document.removeEventListener('mousedown', closeIfOutside)
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
      window.visualViewport?.removeEventListener('resize', reposition)
      window.visualViewport?.removeEventListener('scroll', reposition)
    }
  }, [effectiveOpen, computePosition, closeDropdown])

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
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={closeDropdown}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            closeDropdown()
          }
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
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: 9999,
              transform: pos.placement === 'up' ? 'translateY(-100%)' : 'none',
              borderRadius: '0.75rem',
              border: `1px solid ${PALETTE.inputBorder}`,
              backgroundColor: PALETTE.card,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              overflowY: 'auto',
              maxHeight: pos.maxHeight,
              pointerEvents: 'auto',
            }}
          >
            {filtered.map((tag, i) => {
              const selected = value.toLowerCase() === tag.toLowerCase()
              return (
                <button
                  key={tag}
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    selectTag(tag)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    ...TEXT.body,
                    color: selected ? PALETTE.accent : PALETTE.text,
                    backgroundColor: selected ? PALETTE.accentMuted : 'transparent',
                    fontWeight: selected ? '600' : '400',
                    cursor: 'pointer',
                    borderTop: i > 0 ? `1px solid ${PALETTE.inputBorder}` : 'none',
                  }}
                >
                  {tag}
                </button>
              )
            })}
            {showAddOption && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault()
                  handleAddTag()
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.75rem',
                  ...TEXT.body,
                  color: PALETTE.accent,
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderTop: filtered.length > 0 ? `1px solid ${PALETTE.inputBorder}` : 'none',
                }}
              >
                {`+ ${addTagLabel} "${trimmed}"`}
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
