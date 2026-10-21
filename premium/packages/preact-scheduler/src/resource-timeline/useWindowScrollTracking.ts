import { debounce, useLatest } from '@fullcalendar/preact/protected-api'
import { type RefObject, useLayoutEffect, useState } from 'react'

export interface WindowScrollTracker {
  isTracking: boolean
}

/*
While enabled (height:auto, so the window scrolls the rows rather than the body scroller), reports
the window's scroll relative to the body element, and the window's height as the viewport size
(debounced on resize). Follows `isEnabled` after every commit, and stops on unmount
*/
export function useWindowScrollTracking(
  isEnabled: boolean,
  bodyElRef: RefObject<HTMLElement | null>,
  onScroll: (scroll: number) => void,
  onViewportSize: (size: number) => void,
): WindowScrollTracker {
  const latestRef = useLatest({ onScroll, onViewportSize })

  const [tracker] = useState(() => {
    let bodyOffset = 0
    let lastOffsetQuery = 0
    let resize: [request: () => void, cancel: () => void] | null = null

    const handleWindowScroll = () => {
      const scrollY = window.scrollY
      const now = Date.now()

      if (now - lastOffsetQuery > 200) {
        lastOffsetQuery = now
        bodyOffset = bodyElRef.current.getBoundingClientRect().top + scrollY
      }

      latestRef.current.onScroll(scrollY - bodyOffset)
    }

    const tracker = {
      isTracking: false,

      start() {
        if (!tracker.isTracking) {
          tracker.isTracking = true
          latestRef.current.onViewportSize(window.innerHeight)
          resize = debounce(() => {
            latestRef.current.onViewportSize(window.innerHeight)
          }, 200)
          window.addEventListener('resize', resize[0])
          window.addEventListener('scroll', handleWindowScroll, { passive: true })
        }
      },

      stop() {
        if (tracker.isTracking) {
          tracker.isTracking = false
          resize[1]()
          window.removeEventListener('resize', resize[0])
          window.removeEventListener('scroll', handleWindowScroll, { passive: true } as any)
          resize = null
        }
      },
    }
    return tracker
  })

  // every commit
  useLayoutEffect(() => {
    if (isEnabled) {
      tracker.start()
    } else {
      tracker.stop()
    }
  })

  useLayoutEffect(() => () => {
    tracker.stop()
  }, [])

  return tracker
}
