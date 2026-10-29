import { motion } from 'framer-motion'
import { usePalette } from '@/lib/theme'

// The rings pulse without pause, on their own clock, so the target is always marked.
const RING_SIZE = 44
const RING_SECONDS = 1.6
const RING_DELAYS = [0, RING_SECONDS / 2]

// One tap of the hand. It is hidden only while the cycle restarts.
const HAND_SECONDS = 2.2
// Resting offset of the hand before it moves onto the target.
const HAND_OFFSET = 16

const HAND_TRANSITION = {
  duration: HAND_SECONDS,
  repeat: Infinity,
  ease: 'easeInOut',
  times: [0, 0.1, 0.3, 0.5, 0.6, 0.8, 1],
}

/**
 * Animated "tap here" hint: pulsing rings and a tapping hand centered on the
 * positioned element it is rendered inside. Never intercepts taps.
 */
export default function TapGuide() {
  const PALETTE = usePalette()

  return (
    <>
      {/* Pulsing rings, centered on the target */}
      {RING_DELAYS.map((delay) => (
        <motion.span
          key={delay}
          aria-hidden="true"
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: RING_SIZE,
            height: RING_SIZE,
            marginTop: -RING_SIZE / 2,
            marginLeft: -RING_SIZE / 2,
            borderRadius: '50%',
            border: `3px solid ${PALETTE.accent}`,
            boxShadow: `0 0 10px ${PALETTE.accentGlow}`,
          }}
          initial={{ scale: 0.35, opacity: 0 }}
          animate={{ scale: [0.35, 1.4], opacity: [0.95, 0] }}
          transition={{ duration: RING_SECONDS, repeat: Infinity, ease: 'easeOut', delay }}
        />
      ))}

      {/* Tapping hand, tilted so the finger points at the target from below right */}
      <motion.span
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 'calc(50% - 2px)',
          left: 'calc(50% - 2px)',
          zIndex: 2,
          fontSize: '1.55rem',
          lineHeight: 1,
          rotate: -45,
          filter: `drop-shadow(0 2px 5px ${PALETTE.shadowStrong})`,
        }}
        initial={{ x: HAND_OFFSET, y: HAND_OFFSET, scale: 1, opacity: 0 }}
        animate={{
          x: [HAND_OFFSET, HAND_OFFSET, 0, 0, 0, 0, HAND_OFFSET],
          y: [HAND_OFFSET, HAND_OFFSET, 0, 0, 0, 0, HAND_OFFSET],
          scale: [1, 1, 1, 1, 0.78, 1, 1],
          opacity: [0, 1, 1, 1, 1, 1, 0],
        }}
        transition={HAND_TRANSITION}
      >
        👆
      </motion.span>
    </>
  )
}
