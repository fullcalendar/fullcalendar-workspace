import { EventDragging } from 'fullcalendar'

/*
TODO: use pubsub instead?
*/
export default class TimelineEventDragging extends EventDragging {


  segDragStart(seg, ev) {
    super.segDragStart(seg, ev)

    if ((this.component as any).eventTitleFollower) {
      (this.component as any).eventTitleFollower.forceRelative()
    }
  }


  segDragStop(seg, ev) {
    super.segDragStop(seg, ev)

    if ((this.component as any).eventTitleFollower) {
      (this.component as any).eventTitleFollower.clearForce()
    }
  }

}
