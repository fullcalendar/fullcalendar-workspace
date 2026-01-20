import { createPlugin, PluginDef } from '@fullcalendar/preact/public-api'
import premiumCommonPlugin from '../common'
import { TimelineView } from './components/TimelineView'
import { OPTION_REFINERS } from './options'

export default createPlugin({
  name: 'timeline',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [premiumCommonPlugin],
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
}) as PluginDef
