import { joinClassNames } from '@fullcalendar/preact/public-api'
import { BaseComponent, DateMarker, NowIndicatorDot, NowIndicatorLineContainer } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { TimelineDateProfile } from '../timeline-date-profile'
import { dateToCoord } from '../timeline-positioning'

export interface TimelineNowIndicatorLineProps {
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker

  // dimensions
  slotWidth: number | undefined

  // virtualization (optional)
  clipStart?: number
}

export class TimelineNowIndicatorLine extends BaseComponent<TimelineNowIndicatorLineProps> {
  render() {
    const { props, context } = this
    const clipStart = props.clipStart ?? 0

    const xStyle: { insetInlineStart?: number } =
      props.slotWidth == null
        ? {}
        : {
            insetInlineStart: dateToCoord(props.nowDate, context.dateEnv, props.tDateProfile, props.slotWidth) - clipStart
          }

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
