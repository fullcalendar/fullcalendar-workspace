import { joinClassNames } from '@fullcalendar/core'
import {
  BaseComponent, DateMarker,
  DateProfile,
  DateRange
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

  // virtualization (optional)
  slatStartIndex?: number
  slatCount?: number

  // dimensions
  height?: number
  slotWidth: number | undefined
}

export class TimelineSlats extends BaseComponent<TimelineSlatsProps> {
  render() {
    let { props } = this
    let { tDateProfile, slotWidth, slatStartIndex, slatCount } = props
    let { slotDates, slotDatesMajor } = tDateProfile

    slatStartIndex = props.slatStartIndex || 0
    if (slatStartIndex || slatCount !== undefined) {
      slotDates = slotDates.slice(slatStartIndex, slatStartIndex + slatCount)
    }

    return (
      <div
        aria-hidden
        className={joinClassNames(
          classNames.flexRow,
          classNames.fillY,
        )}
        style={{
          height: props.height,
          width: (props.slotWidth ?? 0) * slotDates.length,
          insetInlineStart: 0,
        }}
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
              isMajor={slotDatesMajor[slatStartIndex + i]}
              borderStart={Boolean(slatStartIndex + i)}

              // dimensions
              width={slotWidth}
            />
          )
        })}
      </div>
    )
  }
}
