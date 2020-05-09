import { h, BaseComponent, Fragment, DateRange, DateMarker, DateProfile } from '@fullcalendar/common'
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
        {cellRows.map((rowCells, i) => {
          let isLast = i === cellRows.length - 1
          let isChrono = tDateProfile.isTimeScale && isLast // the final row, with times?

          return (
            <tr className={(isChrono ? 'fc-timeline-header-row-chrono' : '')}>
              {rowCells.map((cell) => (
                <TimelineHeaderTh
                  key={cell.date.toISOString()}
                  cell={cell}
                  dateProfile={dateProfile}
                  tDateProfile={tDateProfile}
                  todayRange={todayRange}
                  nowDate={nowDate}
                  rowInnerHeight={rowInnerHeights && rowInnerHeights[i]}
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
