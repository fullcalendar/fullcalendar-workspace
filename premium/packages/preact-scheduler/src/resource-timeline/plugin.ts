import { createPlugin, PluginDef } from '@fullcalendar/preact'
import premiumCommonPlugin from '../common'
import timelinePlugin from '../timeline'
import resourcePlugin from '../resource'
import { ResourceTimelineView } from './components/ResourceTimelineView'
import { OPTION_REFINERS } from './options'
import '../common/ambient'

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
