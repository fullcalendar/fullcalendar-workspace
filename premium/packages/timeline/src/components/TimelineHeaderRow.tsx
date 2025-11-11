import { createElement, Ref } from '@fullcalendar/core/preact'
import { afterSize, BaseComponent, DateMarker, DateProfile, DateRange, joinArrayishClassNames, RefMap, setRef } from "@fullcalendar/core/internal"
import classNames from '@fullcalendar/core/internal-classnames'
import { TimelineDateProfile, TimelineHeaderCellData } from "../timeline-date-profile.js"
import { TimelineHeaderCell } from './TimelineHeaderCell.js'

export interface TimelineHeaderRowProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  rowLevel: number // 0 is closest to divider (like "ground floor")
  cells: TimelineHeaderCellData[]

  // ref
  innerHeighRef?: Ref<number>
  innerWidthRef?: Ref<number>

  // dimensions
  slotWidth: number | undefined // TODO: rename to slatWidth
}

interface TimelineHeaderRowState {
  innerHeight?: number
}

export class TimelineHeaderRow extends BaseComponent<TimelineHeaderRowProps, TimelineHeaderRowState> {
  // refs
  private innerWidthRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleInnerWidths)
  })
  private innerHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleInnerHeights)
  })

  render() {
    const { props, innerWidthRefMap, innerHeightRefMap, state, context } = this
    const { options } = context

    return (
      <div
        className={joinArrayishClassNames(
          options.slotLabelRowClass,
          classNames.flexRow,
          classNames.grow,
          props.rowLevel // not the last row?
            ? classNames.borderOnlyB
            : classNames.borderNone,
        )}
        style={{
          // we assign height because we allow cells to have distorted heights for visual effect
          // but we still want to keep the overall extrenal mass
          height: state.innerHeight,
        }}
      >
        {props.cells.map((cell, cellI) => {
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
              isFirst={cellI === 0}

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

  handleInnerWidths = () => {
    const innerWidthMap = this.innerWidthRefMap.current
    let max = 0

    for (const innerWidth of innerWidthMap.values()) {
      max = Math.max(max, innerWidth)
    }

    // TODO: ensure not equal?
    setRef(this.props.innerWidthRef, max)
  }

  handleInnerHeights = () => {
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
    setRef(this.props.innerWidthRef, null)
    setRef(this.props.innerHeighRef, null)
  }
}
