import { BaseComponent, DateRange, DateMarker, DateProfile, RefMapKeyed } from '@fullcalendar/core/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { TimelineDateProfile } from '../timeline-date-profile.js'
import { TimelineHeaderCell } from './TimelineHeaderCell.js'
import { CoordRange } from '../timeline-positioning.js'

export interface TimelineHeaderRowsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  slotWidth: number | undefined
  verticalPositions?: Map<boolean | number, CoordRange>
  rowRefMap?: RefMapKeyed<number, HTMLDivElement>
}

export class TimelineHeaderRows extends BaseComponent<TimelineHeaderRowsProps> {
  render() {
    let {
      dateProfile,
      tDateProfile,
      todayRange,
      nowDate,
      slotWidth,
      verticalPositions,
      rowRefMap,
    } = this.props
    let { cellRows } = tDateProfile

    return (
      <Fragment>
        {cellRows.map((rowCells, rowLevel) => {
          let isLastRow = rowLevel === cellRows.length - 1
          let isChrono = tDateProfile.isTimeScale && isLastRow // the final row, with times?
          let classNames = [
            'fc-timeline-header-row',
            isChrono ? 'fc-timeline-header-row-chrono' : '',
          ]

          const cellPosition = verticalPositions ? verticalPositions.get(rowLevel) : undefined
          const cellHeight = cellPosition ? cellPosition.size : undefined

          return ( // eslint-disable-next-line react/no-array-index-key
            <div
              key={rowLevel}
              className={classNames.join(' ')}
              ref={rowRefMap && rowRefMap.createRef(rowLevel)}
              style={{ height: cellHeight }}
            >
              {rowCells.map((cell, i) => {
                let isLast = i === rowCells.length - 1

                return (
                  <TimelineHeaderCell
                    key={cell.date.toISOString()}
                    cell={cell}
                    rowLevel={rowLevel}
                    dateProfile={dateProfile}
                    tDateProfile={tDateProfile}
                    todayRange={todayRange}
                    nowDate={nowDate}
                    isSticky={!isLastRow}
                    slotWidth={isLast ? undefined : slotWidth}
                  />
                )
              })}
            </div>
          )
        })}
      </Fragment>
    )
  }
}
