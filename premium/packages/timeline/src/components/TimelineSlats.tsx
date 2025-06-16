import {
  BaseComponent, DateMarker,
  DateProfile,
  DateRange, joinClassNames
} from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement } from '@fullcalendar/core/preact'
import { TimelineDateProfile } from '../timeline-date-profile.js'
import { TimelineSlatCell } from './TimelineSlatCell.js'

export interface TimelineSlatsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange

  // dimensions
  height?: number
  slotWidth: number | undefined
}

export class TimelineSlats extends BaseComponent<TimelineSlatsProps> {
  render() {
    let { props } = this
    let { tDateProfile, slotWidth } = props
    let { slotDates, slotDatesMajor } = tDateProfile

    return (
      <div
        aria-hidden
        className={joinClassNames(
          classNames.flexRow,
          classNames.fill
        )}
        style={{ height: props.height }}
      >
        {slotDates.map((slotDate, i) => {
          let key = slotDate.toISOString()

          return (
            <TimelineSlatCell
              key={key}
              date={slotDate}
              dateProfile={props.dateProfile}
              tDateProfile={tDateProfile}
              nowDate={props.nowDate}
              todayRange={props.todayRange}
              isMajor={slotDatesMajor[i]}
              borderStart={Boolean(i)}

              // dimensions
              width={slotWidth}
            />
          )
        })}
      </div>
    )
  }
}
