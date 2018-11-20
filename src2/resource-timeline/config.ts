import { defineView } from 'fullcalendar'
import ResourceTimelineView from './ResourceTimelineView'

defineView('resourceTimeline', {
  class: ResourceTimelineView,
  eventResizableFromStart: true // how is this consumed for TimelineView tho?
})

defineView('resourceTimelineDay', {
  type: 'resourceTimeline',
  duration: { days: 1 }
})

defineView('resourceTimelineWeek', {
  type: 'resourceTimeline',
  duration: { weeks: 1 }
})

defineView('resourceTimelineMonth', {
  type: 'resourceTimeline',
  duration: { months: 1 }
})

defineView('resourceTimelineYear', {
  type: 'resourceTimeline',
  duration: { years: 1 }
})
