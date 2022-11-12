import { createPlugin } from '@fullcalendar/core'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import timelinePlugin from '@fullcalendar/timeline'
import resourcePlugin from '@fullcalendar/resource'
import { ResourceTimelineView } from './ResourceTimelineView.js'
import './index.css'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [
    premiumCommonPlugin,
    resourcePlugin,
    timelinePlugin,
  ],
  initialView: 'resourceTimelineDay',
  views: {
    resourceTimeline: {
      type: 'timeline', // inherit configuration
      component: ResourceTimelineView,
      needsResourceData: true,
      resourceAreaWidth: '30%',
      resourcesInitiallyExpanded: true,
      eventResizableFromStart: true, // TODO: not DRY with this same setting in the main timeline config
    },
    resourceTimelineDay: {
      type: 'resourceTimeline',
      duration: { days: 1 },
    },
    resourceTimelineWeek: {
      type: 'resourceTimeline',
      duration: { weeks: 1 },
    },
    resourceTimelineMonth: {
      type: 'resourceTimeline',
      duration: { months: 1 },
    },
    resourceTimelineYear: {
      type: 'resourceTimeline',
      duration: { years: 1 },
    },
  },
})
