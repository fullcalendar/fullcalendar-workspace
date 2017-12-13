import { defineView } from 'fullcalendar'
import TimelineView from './TimelineView'

defineView('timeline', {
  class: TimelineView,
  defaults: {
    eventResizableFromStart: true
  }
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
