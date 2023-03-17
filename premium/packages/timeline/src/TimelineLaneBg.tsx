import {
  BaseComponent, BgEvent, renderFill,
  getSegMeta, DateRange, DateMarker, buildEventRangeKey,
} from '@fullcalendar/core/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { computeSegHCoords } from './event-placement.js'
import { coordsToCss, TimelineCoords } from './TimelineCoords.js'
import { TimelineLaneSeg } from './TimelineLaneSlicer.js'

export interface TimelineLaneBgProps {
  businessHourSegs: TimelineLaneSeg[] | null // can be null :(
  bgEventSegs: TimelineLaneSeg[] | null // can be null :(
  dateSelectionSegs: TimelineLaneSeg[]
  eventResizeSegs: TimelineLaneSeg[]
  timelineCoords: TimelineCoords | null
  todayRange: DateRange
  nowDate: DateMarker
}

export class TimelineLaneBg extends BaseComponent<TimelineLaneBgProps> {
  render() {
    let { props } = this
    let highlightSeg = [].concat(props.eventResizeSegs, props.dateSelectionSegs)

    return props.timelineCoords && (
      <div className="fc-timeline-bg">
        {/* Fragments contain the keys */}
        {this.renderSegs(props.businessHourSegs || [], props.timelineCoords, 'non-business')}
        {this.renderSegs(props.bgEventSegs || [], props.timelineCoords, 'bg-event')}
        {this.renderSegs(highlightSeg, props.timelineCoords, 'highlight')}
      </div>
    )
  }

  renderSegs(segs: TimelineLaneSeg[], timelineCoords: TimelineCoords | null, fillType: string) {
    let { todayRange, nowDate } = this.props
    let { isRtl } = this.context
    let segHCoords = computeSegHCoords(segs, 0, timelineCoords)

    let children = segs.map((seg, i) => {
      let hcoords = segHCoords[i]
      let hStyle = coordsToCss(hcoords, isRtl)

      return (
        <div
          key={buildEventRangeKey(seg.eventRange)}
          className="fc-timeline-bg-harness"
          style={hStyle}
        >
          {fillType === 'bg-event' ?
            <BgEvent seg={seg} {...getSegMeta(seg, todayRange, nowDate)} /> :
            renderFill(fillType)}
        </div>
      )
    })

    return <Fragment>{children}</Fragment>
  }
}
