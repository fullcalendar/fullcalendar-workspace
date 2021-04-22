import { createPlugin } from '@fullcalendar/common'

import premiumCommonPlugin from '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates
// ensure ambient declarations
import '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates

import { OPTION_REFINERS } from './options'
import './options-declare'

import { TimelineView } from './TimelineView'
import './main.css'

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
  deps: [
    premiumCommonPlugin,
  ],
  initialView: 'timelineDay',
  optionRefiners: OPTION_REFINERS,
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
