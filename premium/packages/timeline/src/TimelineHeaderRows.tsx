import { createElement, BaseComponent, Fragment, DateRange, DateMarker, DateProfile } from '@fullcalendar/common'
import { TimelineDateProfile } from './timeline-date-profile'
import { TimelineHeaderTh } from './TimelineHeaderTh'

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
              {rowCells.map((cell) => (
                <TimelineHeaderTh
                  key={cell.date.toISOString()}
                  cell={cell}
                  rowLevel={rowLevel}
                  dateProfile={dateProfile}
                  tDateProfile={tDateProfile}
                  todayRange={todayRange}
                  nowDate={nowDate}
                  rowInnerHeight={rowInnerHeights && rowInnerHeights[rowLevel]}
                  isSticky={!isLast}
                />
              ))}
            </tr>
          )
        })}
      </Fragment>
    )
  }
}
