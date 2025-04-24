import { createPlugin, PluginDef } from '@fullcalendar/core'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import { TimelineView } from './components/TimelineView.js'
import { OPTION_REFINERS } from './option-refiners.js'
import './ambient.js'
import './index.css'

export default createPlugin({
  name: '<%= pkgName %>',
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
