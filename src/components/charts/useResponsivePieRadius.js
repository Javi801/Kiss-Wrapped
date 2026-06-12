import { useEffect, useState } from 'react'

function getViewportWidth() {
  if (typeof window === 'undefined') return 360
  return window.innerWidth || 360
}

export function useResponsivePieRadius(isFullscreen) {
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth)

  useEffect(() => {
    if (!isFullscreen) return undefined

    const update = () => setViewportWidth(getViewportWidth())
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [isFullscreen])

  if (!isFullscreen) {
    return {
      chartHeight: '14rem',
      innerRadius: 50,
      outerRadius: 80,
    }
  }

  const availableWidth = Math.max(260, viewportWidth - 96)
  const outerRadius = Math.round(Math.min(Math.max(availableWidth * 0.36, 96), 160))

  return {
    chartHeight: 'min(58dvh, 26rem)',
    innerRadius: Math.round(outerRadius * 0.6),
    outerRadius,
  }
}
