import { BaseComponent, DateRange, DateMarker, DateProfile } from '@fullcalendar/core/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { TimelineDateProfile } from './timeline-date-profile.js'
import { TimelineHeaderTh } from './TimelineHeaderTh.js'

export interface TimelineHeaderRowsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  rowInnerHeights?: number[]
}

export class TimelineHeaderRows extends BaseComponent<TimelineHeaderRowsProps> {
  render() {
    let { dateProfile, tDateProfile, rowInnerHeights, todayRange, nowDate } = this.props
    let { cellRows } = tDateProfile

    return (
      <Fragment>
        {cellRows.map((rowCells, rowLevel) => {
          let isLast = rowLevel === cellRows.length - 1
          let isChrono = tDateProfile.isTimeScale && isLast // the final row, with times?
          let classNames = [
            'fc-timeline-header-row',
            isChrono ? 'fc-timeline-header-row-chrono' : '',
          ]

          return ( // eslint-disable-next-line react/no-array-index-key
            <tr key={rowLevel} className={classNames.join(' ')}>
              {rowCells.map((cell) => {
                // TODO: DRY with TimelineSlatsBody key-generation
                const key = cell.dateMarker.toISOString() + (cell.timeZoneOffset || '')
                return (
                  <TimelineHeaderTh
                    key={key}
                    cell={cell}
                    rowLevel={rowLevel}
                    dateProfile={dateProfile}
                    tDateProfile={tDateProfile}
                    todayRange={todayRange}
                    nowDate={nowDate}
                    rowInnerHeight={rowInnerHeights && rowInnerHeights[rowLevel]}
                    isSticky={!isLast}
                  />
                )
              })}
            </tr>
          )
        })}
      </Fragment>
    )
  }
}
