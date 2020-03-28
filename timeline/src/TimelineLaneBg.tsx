import { BaseComponent, h, Fragment, BgEvent, renderFill, getSegMeta, DateRange, DateMarker } from '@fullcalendar/core'
import TimelineCoords from './TimelineCoords'
import { TimelineLaneSeg } from './TimelineLaneSlicer'


export interface TimelineLaneBgProps {
  businessHourSegs: TimelineLaneSeg[] | null // can be null :(
  bgEventSegs: TimelineLaneSeg[] | null // can be null :(
  dateSelectionSegs: TimelineLaneSeg[]
  eventResizeSegs: TimelineLaneSeg[]
  timelineCoords?: TimelineCoords
  todayRange: DateRange
  nowDate: DateMarker
}


export default class TimelineLaneBg extends BaseComponent<TimelineLaneBgProps> {


  render(props: TimelineLaneBgProps) {
    let highlightSeg = [].concat(props.eventResizeSegs, props.dateSelectionSegs)

    return props.timelineCoords && (
      <div class='fc-timeline-bg'>
        {/* Fragments contain the keys */}
        <Fragment>{this.renderSegs(props.businessHourSegs || [], props.timelineCoords, 'nonbusiness')}</Fragment>
        <Fragment>{this.renderSegs(props.bgEventSegs || [], props.timelineCoords, 'bgevent')}</Fragment>
        <Fragment>{this.renderSegs(highlightSeg, props.timelineCoords, 'highlight')}</Fragment>
      </div>
    )
  }


  renderSegs(segs: TimelineLaneSeg[], timelineCoords: TimelineCoords, fillType: string) {
    let { todayRange, nowDate } = this.props

    return segs.map((seg) => {
      let { eventRange } = seg
      let coords = timelineCoords.rangeToCoords(seg) // seg has { start, end }

      // inverse-background events don't have specific instances
      // TODO: might be a key collision. better solution
      let key = eventRange.instance ? eventRange.instance.instanceId : eventRange.def.defId

      return (
        <div class='fc-timeline-bg-harness' style={{
          left: coords.left,
          right: -coords.right // outwards from right edge (which is same as left edge)
        }}>
          {fillType === 'bgevent' ?
            <BgEvent
              key={key}
              seg={seg}
              {...getSegMeta(seg, todayRange, nowDate)}
            /> :
            renderFill(fillType, [ `fc-timeline-${fillType}` ])
          }
        </div>
      )
    })
  }

}
