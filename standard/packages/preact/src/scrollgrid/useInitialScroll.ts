import { type RefObject, useLayoutEffect, useRef, useState } from 'react'
import { ScrollerInterface } from './scroller-types'
import { useLatest } from '../hooks/useLatest'

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
  readPosition?: (scroller: ScrollerInterface) => ScrollCoords // what a user scroll records. default x and y
  // which scroller a reset scrolls to x 0. default scrollerRef. one whose current is null is skipped
  resetXScrollerRef?: RefObject<ScrollerInterface | null>
}

export interface InitialScroll<Logical> {
  handleGeometry: () => void // stable. call when the measurements `project` uses change
  scrollToLogical: (logical: Logical) => void // stable. replaces the target, e.g. for a scroll request
}

/*
Owns when a scroller is scrolled to its initial target, and keeps that target per instance, not per
mount. So a remount from Strict Mode or a shown <Activity> re-applies the current target, or the
position the user scrolled to, instead of jumping back to the initial one (#8112 bug 2).
Applying a logical target first also scrolls x to 0, as the layouts did on reset.
A position the scroller can't reach yet (content still measuring, e.g. after print) is re-applied on
geometry changes until it's reached. A new scroller (the layout swapped it) gets the target too.
See planning/hook-toolkit-spec.md §5.3
*/
export function useInitialScroll<Logical>(input: InitialScrollInput<Logical>): InitialScroll<Logical> {
  const latestRef = useLatest(input)
  const [targetRef] = useState(() => ({
    current: { logical: input.createInitial() } as ScrollTarget<Logical>,
  }))
  const isPositionPendingRef = useRef(false) // a position target not reached yet
  const resetKeyRef = useRef(input.resetKey)
  const wasEnabledRef = useRef(input.isEnabled)
  const attachedRef = useRef<{ scroller: ScrollerInterface, handleScrollEnd: (isDevice: boolean) => void } | null>(null)

  function applyTarget(isGeometryOnly: boolean) {
    const { scrollerRef, resetXScrollerRef, isEnabled, project } = latestRef.current
    const scroller = scrollerRef.current
    const target = targetRef.current

    if (scroller && isEnabled) {
      if ('logical' in target) {
        const coords = project(target.logical)

        if (coords) {
          scroller.scrollTo(coords)
        }
        if (!isGeometryOnly) {
          (resetXScrollerRef || scrollerRef).current?.scrollTo({ x: 0 })
        }
      } else if (!isGeometryOnly || isPositionPendingRef.current) {
        scroller.scrollTo(target.position)
        isPositionPendingRef.current = !isPositionReached(readPosition(scroller), target.position)
      }
    }
  }

  function readPosition(scroller: ScrollerInterface): ScrollCoords {
    const { readPosition } = latestRef.current
    return readPosition ? readPosition(scroller) : { x: scroller.x, y: scroller.y }
  }

  function setTarget(target: ScrollTarget<Logical>) {
    targetRef.current = target
    isPositionPendingRef.current = false
  }

  // returns whether the scroller changed
  function syncListener(): boolean {
    const { scrollerRef, isEnabled } = latestRef.current
    const scroller = isEnabled ? scrollerRef.current : null

    if (scroller === attachedRef.current?.scroller) {
      return false
    }

    detachListener()

    if (scroller) {
      const handleScrollEnd = (isDevice: boolean) => {
        if (latestRef.current.isUserScroll(isDevice)) {
          setTarget({ position: readPosition(scroller) })
        }
      }
      scroller.addScrollEndListener(handleScrollEnd)
      attachedRef.current = { scroller, handleScrollEnd }
    }

    return true
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
        setTarget({ logical: createInitial() })
        shouldApply = true
      }
    }

    if (isEnabled && !wasEnabledRef.current) { // leaving print
      shouldApply = true
    }
    wasEnabledRef.current = isEnabled

    // a new scroller (e.g. the layout changed with dayMinWidth) starts at 0, so re-apply
    if (syncListener() && attachedRef.current) {
      shouldApply = true
    }

    if (shouldApply) {
      applyTarget(false)
    }
  })

  const [scroll] = useState<InitialScroll<Logical>>(() => ({
    handleGeometry() {
      applyTarget(true)
    },
    scrollToLogical(logical: Logical) {
      setTarget({ logical })
      applyTarget(true)
    },
  }))
  return scroll
}

// within a pixel, as browsers round scroll positions
function isPositionReached(current: ScrollCoords, target: ScrollCoords): boolean {
  return (target.x == null || Math.abs(current.x - target.x) < 1) &&
    (target.y == null || Math.abs(current.y - target.y) < 1)
}
