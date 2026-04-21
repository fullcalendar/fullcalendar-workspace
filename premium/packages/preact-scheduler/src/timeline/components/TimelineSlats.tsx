import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  BaseComponent, DateMarker,
  DateProfile,
  DateRange
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { TimelineDateProfile } from '../timeline-date-profile'
import { TimelineSlatCell } from './TimelineSlatCell'

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
          const slatIndex = slatStartIndex + i
          let key = tDateProfile.timeAxis?.slotKeys[slatIndex] ?? slotDate.toISOString()

          return (
            <TimelineSlatCell
              key={key}
              date={slotDate}
              dateProfile={props.dateProfile}
              tDateProfile={tDateProfile}
              nowDate={props.nowDate}
              todayRange={props.todayRange}
              isMajor={slotDatesMajor[slatIndex]}
              borderStart={Boolean(slatIndex)}

              // dimensions
              width={slotWidth}
            />
          )
        })}
      </div>
    )
  }
}
