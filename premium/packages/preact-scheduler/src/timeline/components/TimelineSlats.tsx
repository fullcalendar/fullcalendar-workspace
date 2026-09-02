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
  nowMs: number
  todayRange: DateRange

  // virtualization (optional)
  slatStartIndex?: number
  slatCount?: number

  // dimensions
  height?: number
  slotWidth: number | undefined
  clipStart?: number
}

export class TimelineSlats extends BaseComponent<TimelineSlatsProps> {
  render() {
    let { props } = this
    let { tDateProfile, slotWidth, slatStartIndex, slatCount } = props
    const { timeAxis, slotDatesMajor } = tDateProfile
    let slots = timeAxis?.slots ?? tDateProfile.slotDates.map((date, i) => ({
      date,
      key: tDateProfile.slotKeys[i],
      startMs: null,
    }))

    slatStartIndex = props.slatStartIndex || 0
    if (slatStartIndex || slatCount !== undefined) {
      slots = slots.slice(slatStartIndex, slatStartIndex + slatCount)
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
          width: (props.slotWidth ?? 0) * slots.length,
          insetInlineStart: -(props.clipStart ?? 0),
        }}
      >
        {slots.map((slot, i) => {
          const slatIndex = slatStartIndex + i

          return (
            <TimelineSlatCell
              key={slot.key}
              date={slot.date}
              startMs={slot.startMs}
              dateProfile={props.dateProfile}
              tDateProfile={tDateProfile}
              nowDate={props.nowDate}
              nowMs={props.nowMs}
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
