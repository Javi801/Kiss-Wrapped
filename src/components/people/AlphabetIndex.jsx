import { useEffect, useMemo, useRef, useState } from 'react'

import { usePalette } from '@/lib/theme'

import { ALPHA_INDEX } from '@/components/people/peopleList'

function scrollToGroup(letter) {
  const el = document.getElementById(`group-${letter}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Sticky alphabet strip: tapping or dragging over a letter scrolls to its group.
export default function AlphabetIndex({ grouped }) {
  const PALETTE = usePalette()
  const alphabetRef = useRef(null)
  const [activeLetter, setActiveLetter] = useState(null)
  const fadeTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(fadeTimerRef.current), [])

  const activeLetters = useMemo(() => new Set(grouped.map(([g]) => g)), [grouped])

  function activateLetter(letter) {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    setActiveLetter(letter)
    fadeTimerRef.current = setTimeout(() => setActiveLetter(null), 900)
  }

  function handleAlphabetTouchMove(e) {
    e.preventDefault()
    if (!e.touches.length) return
    const touch = e.touches[0]
    const target = document.elementFromPoint(touch.clientX, touch.clientY)
    const letter = target?.dataset?.letter
    if (letter && activeLetters.has(letter)) {
      // Clear any pending fade so the circle stays visible while dragging.
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
      setActiveLetter(letter)
      scrollToGroup(letter)
    }
  }

  return (
    // Outer div is sticky; inner div is relative (containing block for the indicator).
    <div
      style={{
        width: '20px',
        flexShrink: 0,
        position: 'sticky',
        top: '1rem',
        alignSelf: 'flex-start',
        height: 'calc(100svh - 9rem)',
      }}
    >
      <div
        ref={alphabetRef}
        onTouchMove={handleAlphabetTouchMove}
        onTouchEnd={() => {
          if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
          fadeTimerRef.current = setTimeout(() => setActiveLetter(null), 900)
        }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '0.125rem',
          paddingBottom: '0.125rem',
        }}
      >
        {/* Floating circle — always rendered, transitions opacity & position */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top:
              activeLetter !== null
                ? `${(ALPHA_INDEX.indexOf(activeLetter) / (ALPHA_INDEX.length - 1)) * 100}%`
                : '50%',
            transform: 'translate(-50%, -50%) scale(' + (activeLetter !== null ? '1' : '0.4') + ')',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: PALETTE.accentMuted,
            opacity: activeLetter !== null ? 0.85 : 0,
            pointerEvents: 'none',
            transition:
              'top 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease, transform 0.2s ease',
          }}
        />

        {ALPHA_INDEX.map((letter) => {
          const active = activeLetters.has(letter)
          const selected = activeLetter === letter
          return (
            <button
              key={letter}
              data-letter={letter}
              onClick={() => {
                if (!active) return
                activateLetter(letter)
                scrollToGroup(letter)
              }}
              style={{
                all: 'unset',
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                fontSize: '0.55rem',
                fontWeight: selected ? '800' : active ? '700' : '400',
                lineHeight: 1,
                color: selected
                  ? PALETTE.accentEmphasis
                  : active
                    ? PALETTE.accent
                    : PALETTE.textSoft,
                opacity: active ? 1 : 0.3,
                cursor: active ? 'pointer' : 'default',
                transition: 'color 0.15s',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {letter}
            </button>
          )
        })}
      </div>
    </div>
  )
}
