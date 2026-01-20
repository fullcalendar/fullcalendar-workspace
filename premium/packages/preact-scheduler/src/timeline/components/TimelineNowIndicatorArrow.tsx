import { joinClassNames } from '@fullcalendar/preact/public-api'
import { BaseComponent, DateMarker, NowIndicatorHeaderContainer } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { TimelineDateProfile } from '../timeline-date-profile'
import { dateToCoord } from '../timeline-positioning'

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

    const xStyle: { insetInlineStart?: number } =
      props.slotWidth == null
        ? {}
        : {
            insetInlineStart: dateToCoord(props.nowDate, context.dateEnv, props.tDateProfile, props.slotWidth)
          }

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
        <NowIndicatorHeaderContainer
          className={classNames.abs}
          style={xStyle}
          date={props.nowDate}
        />
      </div>
    )
  }
}
