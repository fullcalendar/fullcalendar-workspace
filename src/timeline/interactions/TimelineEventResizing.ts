import { EventResizing } from 'fullcalendar'

/*
TODO: use pubsub instead?
*/
export default class TimelineEventResizing extends EventResizing {


  segResizeStart(seg, ev) {
    super.segResizeStart(seg, ev)

    if ((this.component as any).eventTitleFollower) {
      return (this.component as any).eventTitleFollower.forceRelative()
    }
  }


  segResizeStop(seg, ev) {
    super.segResizeStop(seg, ev)

    if ((this.component as any).eventTitleFollower) {
      return (this.component as any).eventTitleFollower.clearForce()
    }
  }

}
