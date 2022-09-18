import { createPlugin } from '@fullcalendar/core'

import { default as premiumCommonPlugin } from '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates
// ensure ambient declarations
import '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates

import { TimelineView } from './TimelineView.js'
import './index.css'

export { TimelineView }
export { buildSlatCols } from './TimelineView.js'
export { TimelineLane, TimelineLaneProps, TimelineLaneCoreProps } from './TimelineLane.js'
export { TimelineLaneBg } from './TimelineLaneBg.js'
export { TimelineHeader } from './TimelineHeader.js'
export { TimelineSlats } from './TimelineSlats.js'
export { TimelineDateProfile, buildTimelineDateProfile } from './timeline-date-profile.js'
export { TimelineCoords, coordToCss, coordsToCss } from './TimelineCoords.js'
export { TimelineLaneSlicer, TimelineLaneSeg } from './TimelineLaneSlicer.js'
export { TimelineHeaderRows } from './TimelineHeaderRows.js'

export default createPlugin({
  deps: [
    premiumCommonPlugin,
  ],
  initialView: 'timelineDay',
  views: {

    timeline: {
      component: TimelineView,
      usesMinMaxTime: true,
      eventResizableFromStart: true, // how is this consumed for TimelineView tho?
    },

    timelineDay: {
      type: 'timeline',
      duration: { days: 1 },
    },

    timelineWeek: {
      type: 'timeline',
      duration: { weeks: 1 },
    },

    timelineMonth: {
      type: 'timeline',
      duration: { months: 1 },
    },

    timelineYear: {
      type: 'timeline',
      duration: { years: 1 },
    },

  },
})
