import { createPlugin } from '@fullcalendar/common'
import timelinePlugin from '@fullcalendar/timeline'
import resourceCommonPlugin from '@fullcalendar/resource-common'
import { ResourceTimelineView } from './ResourceTimelineView'
import './main.scss'

export { ResourceTimelineView }
export { ResourceTimelineLane } from './ResourceTimelineLane'
export { SpreadsheetRow } from './SpreadsheetRow'

export default createPlugin({
  deps: [ resourceCommonPlugin, timelinePlugin ],
  initialView: 'resourceTimelineDay',
  views: {

    resourceTimeline: {
      type: 'timeline', // inherit configuration
      component: ResourceTimelineView,
      needsResourceData: true,
      resourceAreaWidth: '30%',
      resourcesInitiallyExpanded: true,
      eventResizableFromStart: true // TODO: not DRY with this same setting in the main timeline config
    },

    resourceTimelineDay: {
      type: 'resourceTimeline',
      duration: { days: 1 }
    },

    resourceTimelineWeek: {
      type: 'resourceTimeline',
      duration: { weeks: 1 }
    },

    resourceTimelineMonth: {
      type: 'resourceTimeline',
      duration: { months: 1 }
    },

    resourceTimelineYear: {
      type: 'resourceTimeline',
      duration: { years: 1 }
    }

  }
})
