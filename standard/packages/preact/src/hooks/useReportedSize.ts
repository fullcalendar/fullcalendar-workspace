import { type Ref, useLayoutEffect, useRef, useState } from 'react'
import { watchSize } from '../component-util/resize-observer'
import { isDimsEqual } from '../component-util/rendering-misc'
import { setRef } from '../vdom-util'
import { useLatest } from './useLatest'

export interface ReportedSizeInput {
  watchWidth?: boolean
  watchHeight?: boolean
  widthRef?: Ref<number>
  heightRef?: Ref<number>
  onSize?: (width: number, height: number) => void // after a watched dimension changes. read live
}

interface Watching {
  el: HTMLElement
  watchWidth: boolean
  watchHeight: boolean
  disconnect: () => void
}

interface Dim {
  value: number | undefined // the last measurement, kept across a detach
  target: Ref<number> | undefined // the ref last reported to
}

/*
Measures an element and reports its width and/or height to the parent's refs, on change only.
Returns a stable ref callback for the element. Registers in a layout effect, after the component's
children have run theirs, so content they append is measured. Reports null on cleanup, and the kept
value again on re-attach (Strict Mode, a shown <Activity>) and to a new target ref.
Ignores reports while the element isn't rendered (inside a display:none subtree).
See planning/hook-toolkit-spec.md §4.2
*/
export function useReportedSize(input: ReportedSizeInput): (el: HTMLElement | null) => void {
  const elRef = useRef<HTMLElement | null>(null)
  const [setEl] = useState(() => (el: HTMLElement | null) => {
    elRef.current = el
  })
  const widthRef = useRef<Dim>({ value: undefined, target: undefined })
  const heightRef = useRef<Dim>({ value: undefined, target: undefined })
  const watchingRef = useRef<Watching | null>(null)
  const { watchWidth = false, watchHeight = false } = input
  const onSizeRef = useLatest(input.onSize)

  // every commit: follow the target refs, the element and what to watch
  useLayoutEffect(() => {
    syncTarget(widthRef.current, input.widthRef)
    syncTarget(heightRef.current, input.heightRef)

    const el = elRef.current
    const watching = watchingRef.current

    if (
      el !== watching?.el ||
      watchWidth !== watching.watchWidth ||
      watchHeight !== watching.watchHeight
    ) {
      watching?.disconnect()
      watchingRef.current = el ? {
        el,
        watchWidth,
        watchHeight,
        disconnect: watchSize(el, (width, height) => {
          if (el.getClientRects().length) { // ignore an element inside display:none
            let isChanged = false

            if (watchWidth) {
              isChanged = reportDim(widthRef.current, width) || isChanged
            }
            if (watchHeight) {
              isChanged = reportDim(heightRef.current, height) || isChanged
            }
            if (isChanged) {
              onSizeRef.current?.(width, height)
            }
          }
        }, watchWidth, watchHeight),
      } : null
    }
  })

  useLayoutEffect(() => () => {
    watchingRef.current?.disconnect()
    watchingRef.current = null
    releaseTarget(widthRef.current)
    releaseTarget(heightRef.current)
  }, [])

  return setEl
}

function syncTarget(dim: Dim, target: Ref<number> | undefined) {
  if (dim.target !== target) {
    releaseTarget(dim)
    dim.target = target

    if (dim.value != null) {
      setRef(target, dim.value)
    }
  }
}

function releaseTarget(dim: Dim) {
  setRef(dim.target, null)
  dim.target = undefined
}

function reportDim(dim: Dim, value: number): boolean {
  if (!isDimsEqual(dim.value, value)) {
    dim.value = value
    setRef(dim.target, value)
    return true
  }
  return false
}
