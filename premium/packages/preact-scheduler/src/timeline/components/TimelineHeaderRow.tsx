import type { Ref } from 'react'
import { joinClassNames } from '@fullcalendar/preact/public-api'
import { afterSize, BaseComponent, DateMarker, DateProfile, DateRange, RefMap, setRef } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { TimelineDateProfile, TimelineHeaderCellData } from "../timeline-date-profile"
import { TimelineHeaderCell } from './TimelineHeaderCell'

export interface TimelineHeaderRowProps {
  className?: string
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
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

interface TimelineHeaderRowState {
  innerHeight?: number
}

export class TimelineHeaderRow extends BaseComponent<TimelineHeaderRowProps, TimelineHeaderRowState> {
  state = {} as TimelineHeaderRowState

  // refs
  private innerWidthRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleInnerWidths)
  })
  private innerHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleInnerHeights)
  })

  // internal
  private _isUnmounting: boolean

  render() {
    const { props, innerWidthRefMap, innerHeightRefMap, state, context } = this
    const { options } = context
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
          classNames.grow,
          props.rowLevel // not the last row?
            ? classNames.borderOnlyB
            : classNames.borderNone,
        )}
        style={{
          insetInlineStart: props.insetInlineStart,
          width: props.width,

          // we assign height because we allow cells to have distorted heights for visual effect
          // but we still want to keep the overall extrenal mass
          height: state.innerHeight,
        }}
      >
        {cells.map((cell, cellI) => {
          // TODO: make this part of the cell obj?
          // TODO: rowUnit seems wrong sometimes. says 'month' when it should be day
          // TODO: rowUnit is relevant to whole row. put it on a row object, not the cells
          // TODO: use rowUnit to key the Row itself?
          const key = cell.rowUnit + ':' + cell.date.toISOString()

          return (
            <TimelineHeaderCell
              key={key}
              cell={cell}
              rowLevel={props.rowLevel}
              dateProfile={props.dateProfile}
              tDateProfile={props.tDateProfile}
              todayRange={props.todayRange}
              nowDate={props.nowDate}
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
  }

  componentDidMount(): void {
    this._isUnmounting = false
  }

  handleInnerWidths = () => {
    if (this._isUnmounting) return
    const innerWidthMap = this.innerWidthRefMap.current
    let max = 0

    for (const innerWidth of innerWidthMap.values()) {
      max = Math.max(max, innerWidth)
    }

    // TODO: ensure not equal?
    setRef(this.props.innerWidthRef, max)
  }

  handleInnerHeights = () => {
    if (this._isUnmounting) return
    const innerHeightMap = this.innerHeightRefMap.current
    let max = 0

    for (const innerHeight of innerHeightMap.values()) {
      max = Math.max(max, innerHeight)
    }

    // TODO: ensure not equal?
    setRef(this.props.innerHeighRef, max)
    this.setState({ innerHeight: max })
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
    setRef(this.props.innerWidthRef, null)
    setRef(this.props.innerHeighRef, null)
  }
}
