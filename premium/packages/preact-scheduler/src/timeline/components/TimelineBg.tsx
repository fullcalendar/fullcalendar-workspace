import {
  BaseComponent, BgEvent, renderFill,
  getEventRangeMeta, DateRange, DateMarker, buildEventRangeKey,
  EventRangeProps,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { computeSegHorizontals } from '../timeline-positioning'
import { ESTIMATED_SLOT_WIDTH } from '../slot-estimate'
import { TimelineRange } from '../TimelineLaneSlicer'
import { TimelineDateProfile } from '../timeline-date-profile'

export interface TimelineBgProps {
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  nowMs: number
  todayRange: DateRange

  // content
  bgEventSegs: (TimelineRange & EventRangeProps)[] | null // can be null :(
  businessHourSegs: (TimelineRange & EventRangeProps)[] | null // can be null :(
  dateSelectionSegs: (TimelineRange & EventRangeProps)[] | null // can be null :(
  eventResizeSegs: (TimelineRange & EventRangeProps)[] | null

  // dimensions
  slotWidth: number | undefined

  // virtualization (optional)
  clipStart?: number
  clipEnd?: number
}

export class TimelineBg extends BaseComponent<TimelineBgProps> {
  render() {
    let { props } = this
    let highlightSeg = [].concat(props.eventResizeSegs || [], props.dateSelectionSegs || [])

    return (
      <>
        {this.renderSegs(props.businessHourSegs || [], 'non-business')}
        {this.renderSegs(props.bgEventSegs || [], 'bg-event')}
        {this.renderSegs(highlightSeg, 'highlight')}
      </>
    )
  }

  renderSegs(segs: (TimelineRange & EventRangeProps)[], fillType: string) {
    const { props, context } = this
    const { dateEnv, options } = context
    const { tDateProfile, todayRange, nowDate } = props
    const clipStart = props.clipStart ?? 0
    const clipEnd = props.clipEnd ?? Infinity
    // fills follow the same assumed-then-measured path as events, so the first
    // paint isn't missing its background while the foreground is present
    const slotWidth = props.slotWidth ?? ESTIMATED_SLOT_WIDTH

    return (
      <>
        {segs.map((seg) => {
          const horizontal = computeSegHorizontals(seg, undefined, dateEnv, tDateProfile, slotWidth)

          if (horizontal) {
            let { start, end } = horizontal
            start = Math.max(start, clipStart)
            end = Math.min(end, clipEnd)

            if (start < end) {
              return (
                <div
                  key={buildEventRangeKey(seg.eventRange)}
                  className={classNames.fillY}
                  style={{
                    insetInlineStart: start - clipStart,
                    width: end - start,
                  }}
                >
                  {fillType === 'bg-event' ? (
                    <BgEvent
                      eventRange={seg.eventRange}
                      isStart={seg.isStart}
                      isEnd={seg.isEnd}
                      isVertical={false}
                      {...getEventRangeMeta(seg.eventRange, todayRange, nowDate, props.nowMs)}
                    />
                  ) : (
                    renderFill(fillType, options)
                  )}
                </div>
              )
            }
          }
        })}
      </>
    )
  }
}
