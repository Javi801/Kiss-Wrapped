import { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * Renders a decorative animated background with bubbles and stars.
 * It is purely visual and does not handle user interaction.
 */
export default function BubbleStarsBackground() {
  // Precompute all floating items once to keep animation stable.
  const items = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        id: index,
        left: 6 + ((index * 91) % 88),
        top: 4 + ((index * 47) % 90),
        size: index % 4 === 0 ? 14 : index % 3 === 0 ? 10 : 7,
        duration: 6 + (index % 5),
        delay: (index % 6) * 0.4,
        opacity: index % 2 === 0 ? 0.26 : 0.16,
        shape: index % 3 === 0 ? 'star' : 'bubble',
      })),
    []
  )

  return (
    <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {items.map((item) => (
        <motion.div
          key={item.id}
          style={{ position: 'absolute', left: `${item.left}%`, top: `${item.top}%` }}
          animate={{
            y: [0, -18, 6, -10, 0],
            x: [0, 6, -4, 5, 0],
            scale: [1, 1.06, 0.98, 1.03, 1],
            opacity: [item.opacity * 0.75, item.opacity, item.opacity * 0.8, item.opacity],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {item.shape === 'bubble' ? (
            <div
              className="rounded-full"
              style={{
                width: item.size,
                height: item.size,
                border: '1px solid rgba(255,255,255,0.4)',
                backgroundColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(1px)',
              }}
            />
          ) : (
            <div
              style={{
                width: item.size,
                height: item.size,
                background: 'rgba(255,255,255,0.28)',
                clipPath:
                  'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                filter: 'blur(0.2px)',
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  )
}
