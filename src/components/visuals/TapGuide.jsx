import { motion } from 'framer-motion'
import { usePalette } from '@/lib/theme'

// The ripple and the hand share one cycle so the ripple bursts on the tap.
const CYCLE_SECONDS = 3.2
const RIPPLE_SIZE = 25
// Resting offset of the hand before it moves onto the target.
const HAND_OFFSET = 18

const RIPPLE_TRANSITION = {
  duration: CYCLE_SECONDS,
  repeat: Infinity,
  ease: 'easeOut',
  scale: { duration: CYCLE_SECONDS, repeat: Infinity, ease: 'easeOut', times: [0, 0.38, 0.68, 1] },
  opacity: {
    duration: CYCLE_SECONDS,
    repeat: Infinity,
    ease: 'easeOut',
    times: [0, 0.38, 0.45, 0.68, 1],
  },
}

const HAND_TRANSITION = {
  duration: CYCLE_SECONDS,
  repeat: Infinity,
  ease: 'easeInOut',
  times: [0, 0.18, 0.28, 0.44, 0.52, 0.7, 1],
}

/**
 * Animated "tap here" hint: a ripple and a tapping hand centered on the
 * positioned element it is rendered inside. Never intercepts taps.
 */
export default function TapGuide() {
  const PALETTE = usePalette()

  return (
    <>
      {/* Tap ripple, centered on the target */}
      <motion.span
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: RIPPLE_SIZE,
          height: RIPPLE_SIZE,
          marginTop: -RIPPLE_SIZE / 2,
          marginLeft: -RIPPLE_SIZE / 2,
          borderRadius: '50%',
          border: `2px solid ${PALETTE.accent}`,
        }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 0.2, 2.4, 0.2], opacity: [0, 0, 0.8, 0, 0] }}
        transition={RIPPLE_TRANSITION}
      />

      {/* Tapping hand */}
      <motion.span
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 'calc(50% + 12px)',
          left: 'calc(50% + 16px)',
          zIndex: 2,
          fontSize: '1.55rem',
          lineHeight: 1,
          filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.18))',
        }}
        initial={{ x: HAND_OFFSET, y: HAND_OFFSET, scale: 1, opacity: 0 }}
        animate={{
          x: [HAND_OFFSET, HAND_OFFSET, 0, 0, 0, HAND_OFFSET, HAND_OFFSET],
          y: [HAND_OFFSET, HAND_OFFSET, 0, 0, 0, HAND_OFFSET, HAND_OFFSET],
          scale: [1, 1, 1, 1, 0.78, 1, 1],
          opacity: [0, 0, 1, 1, 1, 0, 0],
        }}
        transition={HAND_TRANSITION}
      >
        👆
      </motion.span>
    </>
  )
}
