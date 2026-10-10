import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePalette } from '@/lib/theme'
import mainBackground from '@/assets/main-background.png'

/**
 * Displays the main circular hero visual.
 * Falls back gracefully if the image fails to load.
 * `size` is the diameter in rem; the inner layers scale with it.
 */
export default function HeroVisualPlaceholder({ size = 18 }) {
  const PALETTE = usePalette()
  const heroSurfaceBg = PALETTE.isDark ? 'rgba(255,255,255,0.16)' : PALETTE.surfaceBg
  // Track if the image loads correctly.
  const [hasImage, setHasImage] = useState(true)
  const ringInset = `${size / 12}rem`
  const imageSize = `${(size * 2) / 3}rem`

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        height: `${size}rem`,
        width: `${size}rem`,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '9999px',
        backdropFilter: 'blur(4px)',
        backgroundColor: heroSurfaceBg,
      }}
    >
      {/* Background gradient layer */}
      <div
        style={{
          position: 'absolute',
          top: ringInset,
          right: ringInset,
          bottom: ringInset,
          left: ringInset,
          borderRadius: '9999px',
          background: `linear-gradient(135deg, ${PALETTE.accentMuted}, ${PALETTE.cardSoft}, ${PALETTE.gradientEnd})`,
        }}
      />

      {/* Floating animated container */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut' }}
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          height: imageSize,
          width: imageSize,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: '32px',
          textAlign: 'center',
        }}
      >
        {hasImage ? (
          <img
            src={mainBackground}
            alt="Kiss Wrapped visual"
            style={{ height: '100%', width: '100%', objectFit: 'contain' }}
            onError={() => setHasImage(false)}
          />
        ) : (
          // Fallback when image is missing.
          <div style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem' }} />
        )}
      </motion.div>
    </div>
  )
}
