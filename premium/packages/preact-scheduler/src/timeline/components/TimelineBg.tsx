import {
  BaseComponent, BgEvent, renderFill,
  getEventRangeMeta, DateRange, DateMarker, buildEventRangeKey,
  EventRangeProps,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { computeSegHorizontals } from '../event-placement'
import { TimelineRange } from '../TimelineLaneSlicer'
import { TimelineDateProfile } from '../timeline-date-profile'

export interface TimelineBgProps {
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
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
    const { tDateProfile, todayRange, nowDate, slotWidth } = props
    const clipStart = props.clipStart ?? 0
    const clipEnd = props.clipEnd ?? Infinity

    return (
      <>
        {segs.map((seg) => {
          if (slotWidth != null) {
            let { start, size } = computeSegHorizontals(seg, undefined, dateEnv, tDateProfile, slotWidth)!
            let end = start + size
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
                      {...getEventRangeMeta(seg.eventRange, todayRange, nowDate)}
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
