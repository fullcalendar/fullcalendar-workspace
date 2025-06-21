import { BaseComponent, DateMarker, joinClassNames, NowIndicatorDot, NowIndicatorLineContainer } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
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
    const xStyle = props.slotWidth != null
      ? horizontalCoordToCss(
          dateToCoord(props.nowDate, context.dateEnv, props.tDateProfile, props.slotWidth),
          context.isRtl
        )
      : {}

    return (
      <div
        className={classNames.fill}
        style={{
          zIndex: 2, // inlined from $now-indicator-z
          pointerEvents: 'none', // TODO: className
        }}
      >
        <NowIndicatorLineContainer
          className={joinClassNames(
            classNames.fillY,
            classNames.noMarginY,
            classNames.borderlessY,
          )}
          style={xStyle}
          date={props.nowDate}
        />
        <div
          className={joinClassNames(
            classNames.flexCol, // better for negative margins
            classNames.fillY,
          )}
          style={xStyle}
        >
          <div
            // stickiness on NowIndicatorDot misbehaves b/c of negative marginss
            className={classNames.stickyT}
          >
            <NowIndicatorDot />
          </div>
        </div>
      </div>
    )
  }
}
