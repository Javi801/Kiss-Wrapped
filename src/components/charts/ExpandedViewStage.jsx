import { useEffect, useRef, useState } from 'react'
import { EXPANDED_VIEW_SIZE } from '@/lib/constants'

function getExpandedViewScale(width, height) {
  return Math.min(width / EXPANDED_VIEW_SIZE.width, height / EXPANDED_VIEW_SIZE.height)
}

/**
 * Fits the fixed-size expanded view into the available space.
 * Only the parent is scaled, so the captured node keeps its full size.
 */
export default function ExpandedViewStage({ captureRef, children }) {
  const stageRef = useRef(null)
  const [scale, setScale] = useState(() =>
    getExpandedViewScale(window.innerWidth, window.innerHeight)
  )

  useEffect(() => {
    const stage = stageRef.current
    const fit = () => {
      const width = stage.clientWidth || window.innerWidth
      const height = stage.clientHeight || window.innerHeight
      setScale(getExpandedViewScale(width, height))
    }

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', fit)
      return () => window.removeEventListener('resize', fit)
    }
    const observer = new ResizeObserver(fit)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={stageRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: EXPANDED_VIEW_SIZE.width * scale,
          height: EXPANDED_VIEW_SIZE.height * scale,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            ...EXPANDED_VIEW_SIZE,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <div ref={captureRef} data-expanded-view style={EXPANDED_VIEW_SIZE}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
