import {
  BaseComponent, BgEvent, renderFill,
  getEventRangeMeta, DateRange, DateMarker, buildEventRangeKey,
  EventRangeProps,
} from '@fullcalendar/core/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { computeSegHorizontals } from '../event-placement.js'
import { horizontalsToCss } from '../TimelineCoords.js'
import { TimelineRange } from '../TimelineLaneSlicer.js'
import { TimelineDateProfile } from '../timeline-date-profile.js'

export interface TimelineBgProps {
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange

  // content
  bgEventSegs: (TimelineRange & EventRangeProps)[] | null // can be null :(
  businessHourSegs: (TimelineRange & EventRangeProps)[] | null // can be null :(
  dateSelectionSegs: (TimelineRange & EventRangeProps)[]
  eventResizeSegs: (TimelineRange & EventRangeProps)[]

  // dimensions
  slotWidth: number | undefined
}

export class TimelineBg extends BaseComponent<TimelineBgProps> {
  render() {
    let { props } = this
    let highlightSeg = [].concat(props.eventResizeSegs, props.dateSelectionSegs)

    return (
      <Fragment>
        {this.renderSegs(props.businessHourSegs || [], 'non-business')}
        {this.renderSegs(props.bgEventSegs || [], 'bg-event')}
        {this.renderSegs(highlightSeg, 'highlight')}
      </Fragment>
    )
  }

  renderSegs(segs: (TimelineRange & EventRangeProps)[], fillType: string) {
    let { tDateProfile, todayRange, nowDate, slotWidth } = this.props
    let { dateEnv, isRtl } = this.context

    return (
      <Fragment>
        {segs.map((seg) => {
          let hStyle: ReturnType<typeof horizontalsToCss> // TODO

          if (slotWidth != null) {
            let segHorizontal = computeSegHorizontals(seg, undefined, dateEnv, tDateProfile, slotWidth)
            hStyle = horizontalsToCss(segHorizontal, isRtl)
          }

          return (
            <div
              key={buildEventRangeKey(seg.eventRange)}
              className="fc-fill-y"
              style={hStyle}
            >
              {fillType === 'bg-event' ?
                <BgEvent
                  eventRange={seg.eventRange}
                  isStart={seg.isStart}
                  isEnd={seg.isEnd}
                  {...getEventRangeMeta(seg.eventRange, todayRange, nowDate)}
                /> : (
                  renderFill(fillType)
                )
              }
            </div>
          )
        })}
      </Fragment>
    )
  }
}
