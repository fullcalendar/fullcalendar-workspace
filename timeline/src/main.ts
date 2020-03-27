import { createPlugin } from '@fullcalendar/core'
import TimelineView from './TimelineView'
import './main.scss'

export { TimelineView }
export { buildSlatCols } from './TimelineView'
export { default as TimelineLane, TimelineLaneProps, TimelineLaneCoreProps } from './TimelineLane'
export { default as TimelineLaneBg } from './TimelineLaneBg'
export { default as TimelineHeader } from './TimelineHeader'
export { default as TimelineSlats } from './TimelineSlats'
export { TimelineDateProfile, buildTimelineDateProfile } from './timeline-date-profile'
export { default as TimelineCoords } from './TimelineCoords'
export { default as TimelineLaneSlicer, TimelineLaneSeg } from './TimelineLaneSlicer'
export { default as TimelineHeaderRows } from './TimelineHeaderRows'

export default createPlugin({
  defaultView: 'timelineDay',
  views: {

    timeline: {
      component: TimelineView,
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
