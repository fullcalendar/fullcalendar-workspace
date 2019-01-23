import { createPlugin } from 'fullcalendar'
import TimelineView from './TimelineView'

let viewConfigs = {

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

export { TimelineView }
export { default as ScrollJoiner } from './util/ScrollJoiner'

export default createPlugin({
  viewConfigs
})
