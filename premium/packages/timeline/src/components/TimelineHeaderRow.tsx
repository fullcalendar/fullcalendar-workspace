import { createElement, Ref } from '@fullcalendar/core/preact'
import { afterSize, BaseComponent, DateMarker, DateProfile, DateRange, joinClassNames, RefMap, setRef } from "@fullcalendar/core/internal"
import { TimelineDateProfile, TimelineHeaderCellData } from "../timeline-date-profile.js"
import { TimelineHeaderCell } from './TimelineHeaderCell.js'

export interface TimelineHeaderRowProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  rowLevel: number
  isLastRow: boolean
  cells: TimelineHeaderCellData[]

  // ref
  innerHeighRef?: Ref<number>
  innerWidthRef?: Ref<number>

  // dimensions
  slotWidth: number | undefined // TODO: rename to slatWidth
  height?: number
}

export class TimelineHeaderRow extends BaseComponent<TimelineHeaderRowProps> {
  // refs
  private innerWidthRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleInnerWidths)
  })
  private innerHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleInnerHeights)
  })

  render() {
    const { props, innerWidthRefMap, innerHeightRefMap } = this
    const isCentered = !(props.tDateProfile.isTimeScale && props.isLastRow)
    const isSticky = !props.isLastRow

    return (
      <div
        className={joinClassNames(
          'fc-flex-row fc-content-box',
          !props.isLastRow && 'fc-border-b',
        )}
        style={{ height: props.height }}
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
              isCentered={isCentered}
              isSticky={isSticky}
              borderStart={Boolean(cellI)}

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
  }

  componentWillUnmount(): void {
    setRef(this.props.innerWidthRef, null)
    setRef(this.props.innerHeighRef, null)
  }
}
