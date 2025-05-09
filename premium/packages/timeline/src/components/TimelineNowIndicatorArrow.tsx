import { BaseComponent, DateMarker, joinClassNames, NowIndicatorLabelContainer } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement } from '@fullcalendar/core/preact'
import { TimelineDateProfile } from '../timeline-date-profile.js'
import { horizontalCoordToCss } from '../TimelineCoords.js'
import { dateToCoord } from '../timeline-positioning.js'

export interface TimelineNowIndicatorArrowProps {
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker

  // dimensions
  slotWidth: number | undefined
}

/*
TODO: DRY with other NowIndicator components
*/
export class TimelineNowIndicatorArrow extends BaseComponent<TimelineNowIndicatorArrowProps> {
  render() {
    const { props, context } = this

    return (
      <div
        // crop any overflow that the arrow/line might cause
        // TODO: just do this on the entire canvas within the scroller
        className={joinClassNames(classNames.fill, classNames.crop)}
        style={{
          zIndex: 2, // inlined from $now-indicator-z
          pointerEvents: 'none', // TODO: className
        }}
      >
        <NowIndicatorLabelContainer
          className={classNames.abs}
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
