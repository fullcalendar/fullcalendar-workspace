import {
  BaseComponent, BgEvent, renderFill,
  getEventRangeMeta, DateRange, DateMarker, buildEventRangeKey,
  EventRangeProps,
} from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { computeSegHorizontals } from '../event-placement.js'
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
  eventResizeSegs: (TimelineRange & EventRangeProps)[] | null

  // dimensions
  slotWidth: number | undefined
}

export class TimelineBg extends BaseComponent<TimelineBgProps> {
  render() {
    let { props } = this
    let highlightSeg = [].concat(props.eventResizeSegs || [], props.dateSelectionSegs)

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
    let { dateEnv, options } = this.context

    return (
      <Fragment>
        {segs.map((seg) => {
          let hStyle: { insetInlineStart?: number, width?: number } = {}

          if (slotWidth != null) {
            let segHorizontal = computeSegHorizontals(seg, undefined, dateEnv, tDateProfile, slotWidth)
            hStyle = { insetInlineStart: segHorizontal.start, width: segHorizontal.size }
          }

          return (
            <div
              key={buildEventRangeKey(seg.eventRange)}
              className={classNames.fillY}
              style={hStyle}
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
        })}
      </Fragment>
    )
  }
}
