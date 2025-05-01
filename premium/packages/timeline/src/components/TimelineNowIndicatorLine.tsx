import { BaseComponent, DateMarker, NowIndicatorLineContainer } from '@fullcalendar/core/internal'
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

/*
TODO: DRY with other NowIndicator components
*/
export class TimelineNowIndicatorLine extends BaseComponent<TimelineNowIndicatorLineProps> {
  render() {
    const { props, context } = this

    return (
      <div
        // crop any overflow that the arrow/line might cause
        // TODO: just do this on the entire canvas within the scroller
        className="fcu-fill fcu-crop"
        style={{
          zIndex: 2, // inlined from $now-indicator-z
          pointerEvents: 'none', // TODO: className
        }}
      >
        <NowIndicatorLineContainer
          className='fcu-fill-y'
          style={
            props.slotWidth != null
              ? horizontalCoordToCss(
                  dateToCoord(props.nowDate, context.dateEnv, props.tDateProfile, props.slotWidth),
                  context.isRtl
                )
              : {}
          }
          date={props.nowDate}
        />
      </div>
    )
  }
}
