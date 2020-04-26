import { createPlugin } from '@fullcalendar/common'
import { TimelineView } from './TimelineView'
import './main.scss'

export { TimelineView }
export { buildSlatCols } from './TimelineView'
export { TimelineLane, TimelineLaneProps, TimelineLaneCoreProps } from './TimelineLane'
export { TimelineLaneBg } from './TimelineLaneBg'
export { TimelineHeader } from './TimelineHeader'
export { TimelineSlats } from './TimelineSlats'
export { TimelineDateProfile, buildTimelineDateProfile } from './timeline-date-profile'
export { TimelineCoords } from './TimelineCoords'
export { TimelineLaneSlicer, TimelineLaneSeg } from './TimelineLaneSlicer'
export { TimelineHeaderRows } from './TimelineHeaderRows'

export default createPlugin({
  initialView: 'timelineDay',
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
