import { memo, useLayoutEffect, useRef, useState, type Ref } from 'react'
import { joinClassNames } from '@fullcalendar/preact/public-api'
import { afterSize, DateMarker, DateProfile, DateRange, RefMap, setRef, useLatest, useViewContext } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { TimelineDateProfile, TimelineHeaderCellData } from '../timeline-date-profile'
import { TimelineHeaderCell } from './TimelineHeaderCell'

export interface TimelineHeaderRowProps {
  className?: string
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  nowMs: number
  todayRange: DateRange
  rowLevel: number // 0 is closest to divider (like "ground floor")
  cells: TimelineHeaderCellData[]

  // virtualization (optional)
  insetInlineStart?: number // needs position:relative
  cellStartIndex?: number
  cellCount?: number
  width?: number

  // ref
  innerHeighRef?: Ref<number>
  innerWidthRef?: Ref<number>

  // dimensions
  slotWidth: number | undefined
    // pairs with each cell.colspan to determine header-cell width
    // TODO: rename to slatWidth?
}

export const TimelineHeaderRow = memo(function TimelineHeaderRow(props: TimelineHeaderRowProps) {
  const { options } = useViewContext()
  const [innerHeight, setInnerHeight] = useState<number | null | undefined>(undefined)
  const isActiveRef = useRef(false)
  const propsRef = useLatest(props)

  const [refMaps] = useState(() => {
    const handleInnerWidths = () => {
      if (isActiveRef.current) {
        let max: number | null = null

        for (const innerWidth of innerWidthRefMap.current.values()) {
          max = Math.max(max || 0, innerWidth)
        }

        // TODO: ensure not equal?
        setRef(propsRef.current.innerWidthRef, max)
      }
    }

    const handleInnerHeights = () => {
      if (isActiveRef.current) {
        let max: number | null = null

        for (const innerHeight of innerHeightRefMap.current.values()) {
          max = Math.max(max || 0, innerHeight)
        }

        // TODO: ensure not equal?
        setRef(propsRef.current.innerHeighRef, max)
        setInnerHeight(max)
      }
    }

    const innerWidthRefMap = new RefMap<string, number>(() => {
      afterSize(handleInnerWidths)
    })
    const innerHeightRefMap = new RefMap<string, number>(() => {
      afterSize(handleInnerHeights)
    })

    return { innerWidthRefMap, innerHeightRefMap }
  })
  const { innerWidthRefMap, innerHeightRefMap } = refMaps

  useLayoutEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
      setRef(propsRef.current.innerWidthRef, null)
      setRef(propsRef.current.innerHeighRef, null)
    }
  }, [])

  let { cells, cellStartIndex, cellCount } = props

  cellStartIndex = cellStartIndex || 0
  if (cellStartIndex || cellCount !== undefined) {
    cells = cells.slice(cellStartIndex, cellStartIndex + cellCount)
  }

  return (
    <div
      className={joinClassNames(
        props.className,
        options.slotHeaderRowClass,
        classNames.flexRow,
        classNames.borderlessX,
        classNames.borderlessTop,
        !props.rowLevel && classNames.borderlessBottom, // last row
      )}
      style={{
        insetInlineStart: props.insetInlineStart,
        width: props.width,

        // we assign height because we allow cells to have distorted heights for visual effect
        // but we still want to keep the overall extrenal mass
        height: innerHeight,
      }}
    >
      {cells.map((cell, cellI) => {
        // TODO: make this part of the cell obj?
        // TODO: rowUnit seems wrong sometimes. says 'month' when it should be day
        // TODO: rowUnit is relevant to whole row. put it on a row object, not the cells
        // TODO: use rowUnit to key the Row itself?
        const key = cell.key

        return (
          <TimelineHeaderCell
            key={key}
            cell={cell}
            rowLevel={props.rowLevel}
            dateProfile={props.dateProfile}
            tDateProfile={props.tDateProfile}
            todayRange={props.todayRange}
            nowDate={props.nowDate}
            nowMs={props.nowMs}
            isFirst={cellStartIndex + cellI === 0}

            // refs
            innerWidthRef={innerWidthRefMap.createRef(key)}
            innerHeightRef={innerHeightRefMap.createRef(key)}

            // dimensions
            slotWidth={props.slotWidth}
          />
        )
      })}
    </div>
  )
})
