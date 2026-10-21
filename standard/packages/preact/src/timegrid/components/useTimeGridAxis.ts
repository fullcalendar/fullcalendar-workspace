import { type Ref, useLayoutEffect, useRef, useState } from 'react'
import { afterSize } from '../../layout/resize-observer'
import { RefMap } from '../../util/RefMap'
import { setRef } from '../../util/vdom'
import { useLatest } from '../../hooks/useLatest'

export interface TimeGridAxis {
  axisWidth: number | undefined // the widest label in the axis column
  slatInnerHeight: number | undefined // the tallest slat label
  allDayLabelInnerWidthRef: (width: number | null) => void
  headerLabelInnerWidthRefMap: RefMap<number, number> // keyed by tierNum
  slatLabelInnerWidthRefMap: RefMap<string, number> // keyed by slatMeta.key
  slatLabelInnerHeightRefMap: RefMap<string, number> // keyed by slatMeta.key
}

/*
The axis measurements TimeGridLayoutNormal and TimeGridLayoutPannable share: the axis column's width,
from the widest of its labels, and the tallest slat label, which sets the minimum slat height
*/
export function useTimeGridAxis(): TimeGridAxis {
  const [axisWidth, setAxisWidth] = useState<number | undefined>(undefined)
  const [slatInnerHeight, setSlatInnerHeight] = useState<number | undefined>(undefined)
  const isActiveRef = useRef(false)
  const lastRef = useRef<{ axisWidth?: number, slatInnerHeight?: number }>({}) // what was last set

  const [axis] = useState(() => {
    let allDayLabelInnerWidth: number | null = null

    const handleAxisWidths = () => {
      if (isActiveRef.current) {
        let max = allDayLabelInnerWidth || 0 // guard against all-day slot hidden

        for (const headerLabelInnerWidth of headerLabelInnerWidthRefMap.current.values()) {
          max = Math.max(max, headerLabelInnerWidth)
        }

        for (const slatLabelInnerWidth of slatLabelInnerWidthRefMap.current.values()) {
          max = Math.max(max, slatLabelInnerWidth)
        }

        if (lastRef.current.axisWidth !== max) {
          setAxisWidth(lastRef.current.axisWidth = max)
        }
      }
    }

    const handleSlatInnerHeights = () => {
      if (isActiveRef.current) {
        let max = 0

        for (const slatLabelInnerHeight of slatLabelInnerHeightRefMap.current.values()) {
          max = Math.max(max, slatLabelInnerHeight)
        }

        if (lastRef.current.slatInnerHeight !== max) {
          setSlatInnerHeight(lastRef.current.slatInnerHeight = max)
        }
      }
    }

    const headerLabelInnerWidthRefMap = new RefMap<number, number>(() => {
      afterSize(handleAxisWidths)
    })
    const slatLabelInnerWidthRefMap = new RefMap<string, number>(() => {
      afterSize(handleAxisWidths)
    })
    const slatLabelInnerHeightRefMap = new RefMap<string, number>(() => {
      afterSize(handleSlatInnerHeights)
    })

    return {
      allDayLabelInnerWidthRef(width: number | null) {
        allDayLabelInnerWidth = width
        afterSize(handleAxisWidths)
      },
      headerLabelInnerWidthRefMap,
      slatLabelInnerWidthRefMap,
      slatLabelInnerHeightRefMap,
    }
  })

  useLayoutEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
    }
  }, [])

  return { axisWidth, slatInnerHeight, ...axis }
}

/*
Reports the slat height to the layout shell, which scrolls to a time with it. After each commit
that changes it, and null on unmount
*/
export function useSlatHeightReport(slatHeight: number | undefined, slatHeightRef: Ref<number> | undefined): void {
  const reportedRef = useRef<number | undefined>(undefined)
  const targetRef = useLatest(slatHeightRef)

  useLayoutEffect(() => {
    if (reportedRef.current !== slatHeight) {
      setRef(slatHeightRef, reportedRef.current = slatHeight)
    }
  })

  useLayoutEffect(() => () => {
    reportedRef.current = undefined
    setRef(targetRef.current, null)
  }, [])
}
