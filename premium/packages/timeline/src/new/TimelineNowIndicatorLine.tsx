import { BaseComponent, DateMarker, NowIndicatorContainer } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { TimelineDateProfile } from '../timeline-date-profile.js'
import { horizontalCoordToCss } from '../TimelineCoords.js'
import { dateToCoord } from '../timeline-positioning.js'

export interface TimelineNowIndicatorLineProps {
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker

  // dimensions
  slotWidth: number | undefined
}

export class TimelineNowIndicatorLine extends BaseComponent<TimelineNowIndicatorLineProps> {
  render() {
    const { props, context } = this

    return (
      <div className="fcnew-timeline-now-indicator-container">
        <NowIndicatorContainer // TODO: make separate component?
          elClasses={['fcnew-timeline-now-indicator-line']}
          elStyle={
            props.slotWidth != null
              ? horizontalCoordToCss(
                  dateToCoord(props.nowDate, context.dateEnv, props.tDateProfile, props.slotWidth),
                  context.isRtl
                )
              : {}
          }
          isAxis={false}
          date={props.nowDate}
        />
      </div>
    )
  }
}
