import { BaseComponent, RefMap, DateMarker, DateRange, DateProfile } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { TimelineDateProfile } from './timeline-date-profile.js'
import { TimelineSlatCell } from './TimelineSlatCell.js'

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
            const { marker, timeZoneOffset } = slotDate
            const key = marker.toISOString() + (timeZoneOffset || '')

            return (
              <TimelineSlatCell
                key={key}
                elRef={cellElRefs.createRef(key)}
                dateMarker={marker}
                timeZoneOffset={timeZoneOffset}
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
