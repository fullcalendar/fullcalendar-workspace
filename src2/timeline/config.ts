import { defineView } from 'fullcalendar'
import TimelineView from './TimelineView'
import ResourceTimelineView from './ResourceTimelineView'

defineView('timeline', {
  class: TimelineView,
  eventResizableFromStart: true // how is this consumed for TimelineView tho?
})

defineView('timelineDay', {
  type: 'timeline',
  duration: { days: 1 }
})

defineView('timelineWeek', {
  type: 'timeline',
  duration: { weeks: 1 }
})

defineView('timelineMonth', {
  type: 'timeline',
  duration: { months: 1 }
})

defineView('timelineYear', {
  type: 'timeline',
  duration: { years: 1 }
})


// temporary...

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
