import { joinClassNames } from '@fullcalendar/preact/public-api'
import { BaseComponent, NowIndicatorDot, NowIndicatorLineContainer } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { TimelineDateProfile } from '../timeline-date-profile'
import { dateToCoord, msToCoord } from '../timeline-positioning'

export interface TimelineNowIndicatorLineProps {
  tDateProfile: TimelineDateProfile
  nowMs: number // exact instant. unlike a marker, unambiguous during DST folds

  // dimensions
  slotWidth: number | undefined

  // virtualization (optional)
  clipStart?: number
}

export class TimelineNowIndicatorLine extends BaseComponent<TimelineNowIndicatorLineProps> {
  render() {
    const { props, context } = this
    const clipStart = props.clipStart ?? 0
    const nowDate = context.dateEnv.timestampToMarker(props.nowMs)

    const xStyle: { insetInlineStart?: number } =
      props.slotWidth == null
        ? {}
        : {
            insetInlineStart: (
              props.tDateProfile.timeAxis
                ? msToCoord(props.nowMs, props.tDateProfile, props.slotWidth)
                : dateToCoord(nowDate, context.dateEnv, props.tDateProfile, props.slotWidth)
            ) - clipStart
          }

    return (
      <div
        className={joinClassNames(
          classNames.fill,
          classNames.pointerEventsNone,
          classNames.z2,
        )}
      >
        <NowIndicatorLineContainer
          className={joinClassNames(
            classNames.fillY,
            classNames.noMarginY,
            classNames.borderlessY,
          )}
          style={xStyle}
          date={nowDate}
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
