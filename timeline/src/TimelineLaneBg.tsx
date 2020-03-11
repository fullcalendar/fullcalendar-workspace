import { BaseComponent, h } from '@fullcalendar/core'
import TimelineCoords from './TimelineCoords'
import { TimelineLaneSeg } from './TimelineLaneSlicer'


export interface TimelineLaneBgProps {
  businessHourSegs: TimelineLaneSeg[]
  bgEventSegs: TimelineLaneSeg[] | null
  dateSelectionSegs: TimelineLaneSeg[]
  eventResizeSegs: TimelineLaneSeg[]
  timelineCoords?: TimelineCoords
}


export default class TimelineLaneBg extends BaseComponent<TimelineLaneBgProps> {


  render(props: TimelineLaneBgProps) {
    let highlightSeg = [].concat(props.eventResizeSegs, props.dateSelectionSegs)

    return props.timelineCoords && // TODO: use this technique elsewhere: dont render at all if no coords?
      <div class='fc-timeline-bgcontent'>
        {this.renderSegs(props.businessHourSegs, props.timelineCoords, 'fc-nonbusiness')}
        {this.renderSegs(props.bgEventSegs, props.timelineCoords, 'fc-bgevent')}
        {this.renderSegs(highlightSeg, props.timelineCoords, 'fc-highlight')}
      </div>
  }


  renderSegs(segs: TimelineLaneSeg[], timelineCoords: TimelineCoords, className: string) {
    return segs.map((seg) => {
      let coords = timelineCoords.rangeToCoords(seg.eventRange.range)

      return (
        <div className={className} style={{
          left: coords.left,
          right: -coords.right // outwards from right edge (which is same as left edge)
        }} />
      )
    })
  }

}
