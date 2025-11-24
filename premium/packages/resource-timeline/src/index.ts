import { createPlugin, PluginDef } from '@fullcalendar/core'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import timelinePlugin from '@fullcalendar/timeline'
import resourcePlugin from '@fullcalendar/resource'
import { ResourceTimelineView } from './components/ResourceTimelineView.js'
import { OPTION_REFINERS } from './options.js'
import './ambient.js'

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
      resourceColumnsWidth: '30%',
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
  optionRefiners: OPTION_REFINERS,
}) as PluginDef

export * from './structs.js'
export { ResourceTimelineOptions } from './options.js'
