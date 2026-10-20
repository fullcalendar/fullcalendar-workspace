import { type RefObject, useLayoutEffect, useRef, useState } from 'react'
import { ScrollerInterface } from '../scrollgrid/ScrollerInterface'
import { useLatest } from './useLatest'

export interface ScrollCoords {
  x?: number
  y?: number
}

type ScrollTarget<Logical> =
  { logical: Logical } | // e.g. a date or time. projected whenever geometry changes
  { position: ScrollCoords } // where the user scrolled to

export interface InitialScrollInput<Logical> {
  scrollerRef: RefObject<ScrollerInterface | null>
  isEnabled: boolean // false while printing
  createInitial: () => Logical // once per instance, and on each reset
  resetKey: unknown // a new value resets the target, if isResetOnChange. e.g. the date profile
  isResetOnChange: boolean
  project: (logical: Logical) => ScrollCoords | undefined // undefined while measurements are missing
  isUserScroll: (isDevice: boolean) => boolean // whether a scroll end replaces the target
}

export interface InitialScroll {
  handleGeometry: () => void // stable. call when the measurements `project` uses change
}

/*
Owns when a scroller is scrolled to its initial target, and keeps that target per instance, not per
mount. So a remount from Strict Mode or a shown <Activity> re-applies the current target, or the
position the user scrolled to, instead of jumping back to the initial one (#8112 bug 2).
Applying a logical target first also scrolls x to 0, as the layouts did on reset.
See planning/hook-toolkit-spec.md §5.3
*/
export function useInitialScroll<Logical>(input: InitialScrollInput<Logical>): InitialScroll {
  const latestRef = useLatest(input)
  const [targetRef] = useState(() => ({
    current: { logical: input.createInitial() } as ScrollTarget<Logical>,
  }))
  const resetKeyRef = useRef(input.resetKey)
  const wasEnabledRef = useRef(input.isEnabled)
  const attachedRef = useRef<{ scroller: ScrollerInterface, handleScrollEnd: (isDevice: boolean) => void } | null>(null)

  function applyTarget(isGeometryOnly: boolean) {
    const { scrollerRef, isEnabled, project } = latestRef.current
    const scroller = scrollerRef.current
    const target = targetRef.current

    if (scroller && isEnabled) {
      if ('logical' in target) {
        const coords = project(target.logical)

        if (coords) {
          scroller.scrollTo(coords)
        }
        if (!isGeometryOnly) {
          scroller.scrollTo({ x: 0 })
        }
      } else if (!isGeometryOnly) {
        scroller.scrollTo(target.position)
      }
    }
  }

  function syncListener() {
    const { scrollerRef, isEnabled } = latestRef.current
    const scroller = isEnabled ? scrollerRef.current : null

    if (scroller !== attachedRef.current?.scroller) {
      detachListener()

      if (scroller) {
        const handleScrollEnd = (isDevice: boolean) => {
          if (latestRef.current.isUserScroll(isDevice)) {
            targetRef.current = { position: { x: scroller.x, y: scroller.y } }
          }
        }
        scroller.addScrollEndListener(handleScrollEnd)
        attachedRef.current = { scroller, handleScrollEnd }
      }
    }
  }

  function detachListener() {
    const attached = attachedRef.current

    if (attached) {
      attached.scroller.removeScrollEndListener(attached.handleScrollEnd)
      attachedRef.current = null
    }
  }

  // each mount, including a shown <Activity> and a Strict Mode replay
  useLayoutEffect(() => {
    syncListener()
    applyTarget(false)
    return detachListener
  }, [])

  // every commit
  useLayoutEffect(() => {
    const { resetKey, isResetOnChange, isEnabled, createInitial } = input
    let shouldApply = false

    if (resetKey !== resetKeyRef.current) {
      resetKeyRef.current = resetKey

      if (isResetOnChange) {
        targetRef.current = { logical: createInitial() }
        shouldApply = true
      }
    }

    if (isEnabled && !wasEnabledRef.current) { // leaving print
      shouldApply = true
    }
    wasEnabledRef.current = isEnabled

    syncListener()

    if (shouldApply) {
      applyTarget(false)
    }
  })

  const [handleGeometry] = useState(() => () => applyTarget(true))
  return { handleGeometry }
}
