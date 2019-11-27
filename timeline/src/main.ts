import { createPlugin } from '@fullcalendar/core'
import TimelineView from './TimelineView'

export { TimelineView }
export { getTimelineViewClassNames } from './TimelineView'
export { default as TimelineLane, TimelineLaneProps } from './TimelineLane'
export { default as ScrollJoiner } from './util/ScrollJoiner'
export { default as ClippedScroller } from './util/ClippedScroller'
export { default as TimeColsWidthSyncer } from './TimeColsWidthSyncer'
export { default as TimelineHeader } from './TimelineHeader'
export { default as TimelineSlats } from './TimelineSlats'
export { TimelineDateProfile, buildTimelineDateProfile } from './timeline-date-profile'
export { default as TimelineNowIndicator, getTimelineNowIndicatorUnit } from './TimelineNowIndicator'

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
