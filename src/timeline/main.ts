import { createPlugin } from '@fullcalendar/core'
import TimelineView from './TimelineView'

export { TimelineView }
export { default as TimelineLane } from './TimelineLane'
export { default as ScrollJoiner } from './util/ScrollJoiner'
export { default as StickyScroller } from './util/StickyScroller'
export { default as TimeAxis } from './TimeAxis'
export { default as HeaderBodyLayout } from './HeaderBodyLayout'

export default createPlugin({
  defaultView: 'timelineDay',
  views: {

    timeline: {
      class: TimelineView,
      eventResizableFromStart: true // how is this consumed for TimelineView tho?
    },

    timelineDay: {
      type: 'timeline',
      duration: { days: 1 }
    },

    timelineWeek: {
      type: 'timeline',
      duration: { weeks: 1 }
    },

    timelineMonth: {
      type: 'timeline',
      duration: { months: 1 }
    },

    timelineYear: {
      type: 'timeline',
      duration: { years: 1 }
    }

  }
})
