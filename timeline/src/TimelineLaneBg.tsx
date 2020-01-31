import { BaseComponent, h, Fragment } from '@fullcalendar/core'
import TimelineFills from './TimelineFills'
import TimelineCoords from './TimelineCoords'
import { TimelineLaneSeg } from './TimelineLaneSlicer'


export interface TimelineLaneBgProps {
  businessHourSegs: TimelineLaneSeg[]
  bgEventSegs: TimelineLaneSeg[]
  timelineCoords?: TimelineCoords
  dateSelectionSegs: TimelineLaneSeg[]
  eventResizeSegs: TimelineLaneSeg[]
}


export default class TimelineLaneBg extends BaseComponent<TimelineLaneBgProps> {


  render(props: TimelineLaneBgProps) {
    return (
      <Fragment>
        <TimelineFills
          type='businessHours'
          segs={props.businessHourSegs}
          timelineCoords={props.timelineCoords}
        />
        <TimelineFills
          type='bgEvent'
          segs={props.bgEventSegs}
          timelineCoords={props.timelineCoords}
        />
        {this.renderHighlight()}
      </Fragment>
    )
  }


  renderHighlight() {
    let { props } = this

    if (props.eventResizeSegs && props.eventResizeSegs.length) {
      return (
        <TimelineFills
          type='highlight'
          segs={props.eventResizeSegs}
          timelineCoords={props.timelineCoords}
        />
      )
    } else {
      return (
        <TimelineFills
          type='highlight'
          segs={props.dateSelectionSegs}
          timelineCoords={props.timelineCoords}
        />
      )
    }
  }

}
