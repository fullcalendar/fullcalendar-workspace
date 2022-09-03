import { createElement, BaseComponent, RefMap, DateMarker, DateRange, DateProfile } from '@fullcalendar/common'
import { TimelineDateProfile } from './timeline-date-profile'
import { TimelineSlatCell } from './TimelineSlatCell'

export interface TimelineSlatsContentProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
}

export interface TimelineSlatsBodyProps extends TimelineSlatsContentProps {
  cellElRefs: RefMap<HTMLTableCellElement>
}

export class TimelineSlatsBody extends BaseComponent<TimelineSlatsBodyProps> {
  render() {
    let { props } = this
    let { tDateProfile, cellElRefs } = props
    let { slotDates, isWeekStarts } = tDateProfile
    let isDay = !tDateProfile.isTimeScale && !tDateProfile.largeUnit

    return (
      <tbody>
        <tr>
          {slotDates.map((slotDate, i) => {
            let key = slotDate.toISOString()

            return (
              <TimelineSlatCell
                key={key}
                elRef={cellElRefs.createRef(key)}
                date={slotDate}
                dateProfile={props.dateProfile}
                tDateProfile={tDateProfile}
                nowDate={props.nowDate}
                todayRange={props.todayRange}
                isEm={isWeekStarts[i]}
                isDay={isDay}
              />
            )
          })}
        </tr>
      </tbody>
    )
  }
}
