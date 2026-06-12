import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePalette } from '@/lib/theme'

// ---------------------------------------------------------------------------
// Slide transition variants
// ---------------------------------------------------------------------------

const SLIDE_VARIANTS = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
}

const TRANSITION = {
  x: { type: 'spring', stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
}

// ---------------------------------------------------------------------------
// IntroMockup — a miniature simulation of the IntroScreen with an animated
// hand pointing at the hidden ♡ entry button in the top-left corner.
//
// Animation cycle (3 s anim + 0.5 s pause = 3.5 s total):
//   0 %  → hand is hidden, offset 28 px right / 22 px down from the heart
//  10 %  → hand appears at offset position
//  40 %  → hand reaches the ♡ (tap begins)
//  55 %  → hand taps (scale 0.78)
//  70 %  → hand lifts and fades
// 100 %  → hand is back at offset, hidden
//
// Ripple is timed to burst at the tap moment (~t = 1.2 s into the 3.5 s cycle).
// Both animations share the same 3.5 s period so they stay in phase.
// ---------------------------------------------------------------------------

const BUBBLES = [
  { size: 22, top: '18%', left: '72%' },
  { size: 14, top: '55%', left: '14%' },
  { size: 30, top: '68%', left: '62%' },
  { size: 10, top: '38%', left: '8%' },
  { size: 18, top: '82%', left: '30%' },
]

function IntroMockup({ palette }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 155,
        height: 252,
        borderRadius: 22,
        border: `2px solid ${palette.accentSoft}`,
        background: `linear-gradient(145deg, ${palette.accentMuted} 0%, ${palette.gradientMid} 55%, ${palette.gradientEnd} 100%)`,
        overflow: 'hidden',
        boxShadow: `0 8px 32px ${palette.accentShadow}, 0 2px 8px rgba(0,0,0,0.08)`,
      }}
    >
      {/* White radial overlay — mirrors IntroScreen */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.82) 0%, transparent 58%)',
        }}
      />

      {/* Decorative bubbles */}
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: `${palette.accent}18`,
            border: `1px solid ${palette.accent}28`,
            top: b.top,
            left: b.left,
          }}
        />
      ))}

      {/* ♡ button — top-left corner (mirrors IntroScreen) */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          fontSize: '1rem',
          lineHeight: 1,
          color: palette.accentSoft,
          opacity: 0.55,
        }}
      >
        ♡
      </div>

      {/* Center: app identity */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: '2.25rem', lineHeight: 1 }}>💋</span>
      </div>

      {/* Tap ripple — bursts at the tap moment (delay = 1.2 s) */}
      <motion.div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 7,
          left: 7,
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: `2px solid ${palette.accent}`,
          transformOrigin: 'center',
        }}
        animate={{ scale: [0, 2.4], opacity: [0.75, 0] }}
        transition={{
          duration: 0.72,
          delay: 1.2,
          repeat: Infinity,
          // repeatDelay keeps ripple in phase with the hand's 3.5 s cycle:
          // cycle = delay(1.2) + duration(0.72) + repeatDelay(1.58) = 3.5 s ✓
          repeatDelay: 1.58,
          ease: 'easeOut',
        }}
      />

      {/* Animated hand / finger */}
      <motion.div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          // Anchor at heart position; x/y keyframes offset it away at rest
          top: 4,
          left: 3,
          lineHeight: 1,
          filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.18))',
        }}
        animate={{
          x: [28, 28, 0, 0, 0, 28],
          y: [22, 22, 0, 0, 0, 22],
          opacity: [0, 1, 1, 1, 0, 0],
          scale: [1, 1, 1, 0.78, 1, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 0.5,
          times: [0, 0.1, 0.4, 0.55, 0.7, 1],
          ease: 'easeInOut',
        }}
      >
        <span style={{ fontSize: '1.35rem' }}>👆</span>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// OnboardingScreen
// ---------------------------------------------------------------------------

/**
 * Full-screen onboarding carousel shown only on the first app launch.
 * Slides are driven by Framer Motion and support both tap (Next) and swipe.
 *
 * Props:
 *  - t           Active translation dictionary (must include onboardingSlides,
 *                onboardingNext, onboardingDone, onboardingSkip keys)
 *  - onComplete  Called when the user finishes or skips the onboarding
 */
export default function OnboardingScreen({ t, onComplete }) {
  const PALETTE = usePalette()
  const slides = t.onboardingSlides

  // [currentIndex, swipeDirection] — direction drives the enter/exit animation
  const [[index, direction], setPage] = useState([0, 1])

  const isLast = index === slides.length - 1

  function goTo(newIndex, dir) {
    if (newIndex < 0 || newIndex >= slides.length) return
    setPage([newIndex, dir])
  }

  function handleNext() {
    if (isLast) {
      onComplete()
    } else {
      goTo(index + 1, 1)
    }
  }

  // Swipe gesture: trigger page change when drag exceeds threshold
  function handleDragEnd(_, { offset, velocity }) {
    const swipePower = Math.abs(offset.x) * Math.abs(velocity.x)
    const THRESHOLD = 8000
    if (offset.x < -50 && swipePower > THRESHOLD) {
      goTo(index + 1, 1)
    } else if (offset.x > 50 && swipePower > THRESHOLD) {
      goTo(index - 1, -1)
    }
  }

  const slide = slides[index]
  const isMockupSlide = slide.type === 'mockup'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 20,
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${PALETTE.accentMuted}, ${PALETTE.gradientMid}, ${PALETTE.gradientEnd})`,
        paddingTop: 'env(safe-area-inset-top, 1.5rem)',
        paddingBottom: 'env(safe-area-inset-bottom, 1.5rem)',
      }}
    >
      {/* Skip button — top right (hidden on last slide) */}
      {!isLast && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '1rem 1.25rem 0',
          }}
        >
          <button
            type="button"
            onClick={onComplete}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: PALETTE.textSoft,
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0.25rem 0.5rem',
            }}
          >
            {t.onboardingSkip}
          </button>
        </div>
      )}

      {/* Slide area */}
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={TRANSITION}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{
              position: 'absolute',
              width: '100%',
              padding: '0 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '1.25rem',
              userSelect: 'none',
              cursor: 'grab',
            }}
          >
            {/* Visual — mockup or emoji */}
            <motion.div
              initial={{ scale: 0.78, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              style={
                isMockupSlide
                  ? { lineHeight: 1 }
                  : {
                      fontSize: '4rem',
                      lineHeight: 1,
                      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))',
                    }
              }
            >
              {isMockupSlide ? <IntroMockup palette={PALETTE} /> : slide.emoji}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              style={{
                margin: 0,
                fontSize: '1.625rem',
                fontWeight: 700,
                color: PALETTE.text,
                lineHeight: 1.2,
              }}
            >
              {slide.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              style={{
                margin: 0,
                fontSize: '1rem',
                color: PALETTE.textSoft,
                lineHeight: 1.6,
                maxWidth: '22rem',
              }}
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div
        style={{
          width: '100%',
          padding: '0 1.5rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => goTo(i, i > index ? 1 : -1)}
              style={{
                width: i === index ? '1.5rem' : '0.5rem',
                height: '0.5rem',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'width 250ms ease, background 250ms ease',
                background: i === index ? PALETTE.accent : PALETTE.accentSoft,
              }}
            />
          ))}
        </div>

        {/* Next / Get started button */}
        <button
          type="button"
          onClick={handleNext}
          style={{
            width: '100%',
            maxWidth: '20rem',
            padding: '0.875rem 1.5rem',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
            color: '#ffffff',
            background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
            boxShadow: `0 4px 16px ${PALETTE.accent}55`,
            transition: 'opacity 150ms',
          }}
        >
          {isLast ? t.onboardingDone : t.onboardingNext}
        </button>
      </div>
    </div>
  )
}
