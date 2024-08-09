import { createElement, Ref } from '@fullcalendar/core/preact'
import { afterSize, BaseComponent, DateMarker, DateProfile, DateRange, RefMap, setRef } from "@fullcalendar/core/internal"
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

  // dimensions
  slotWidth: number | undefined // TODO: rename to slatWidth
  height?: number

  // ref
  innerHeighRef?: Ref<number>
  innerWidthRef?: Ref<number>
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
    const isChrono = props.tDateProfile.isTimeScale && props.isLastRow // the final row, with times?
    const classNames = [
      'fcnew-row',
      'fc-timeline-header-row',
      isChrono ? 'fc-timeline-header-row-chrono' : '',
    ]

    return (
      <div
        className={classNames.join(' ')}
        style={{ height: props.height }}
      >
        {props.cells.map((cell) => {
          const key = cell.date.toISOString() // TODO: make this part of the cell obj?

          return (
            <TimelineHeaderCell
              key={key}
              cell={cell}
              rowLevel={props.rowLevel}
              dateProfile={props.dateProfile}
              tDateProfile={props.tDateProfile}
              todayRange={props.todayRange}
              nowDate={props.nowDate}
              isSticky={!props.isLastRow}

              // dimensions
              slotWidth={props.slotWidth}

              // refs
              innerWidthRef={innerWidthRefMap.createRef(key)}
              innerHeightRef={innerHeightRefMap.createRef(key)}
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

    setRef(this.props.innerWidthRef, max)
  }

  handleInnerHeights = () => {
    const innerHeightMap = this.innerHeightRefMap.current
    let max = 0

    for (const innerHeight of innerHeightMap.values()) {
      max = Math.max(max, innerHeight)
    }

    setRef(this.props.innerHeighRef, max)
  }
}
