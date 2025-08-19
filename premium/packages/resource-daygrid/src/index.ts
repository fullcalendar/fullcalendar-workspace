import { createPlugin, PluginDef } from '@fullcalendar/core'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import resourcePlugin from '@fullcalendar/resource'
import dayGridPlugin from '@fullcalendar/daygrid'
import { ResourceDayGridView } from './components/ResourceDayGridView.js'
import { OPTION_DEFAULTS, OPTION_REFINERS } from './options.js'
import './ambient.js'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [
    premiumCommonPlugin,
    resourcePlugin,
    dayGridPlugin,
  ],
  initialView: 'resourceDayGridDay',
  views: {
    resourceDayGrid: {
      type: 'dayGrid', // will inherit this configuration
      component: ResourceDayGridView,
      needsResourceData: true,
    },
    resourceDayGridDay: {
      type: 'resourceDayGrid',
      duration: { days: 1 },
    },
    resourceDayGridWeek: {
      type: 'resourceDayGrid',
      duration: { weeks: 1 },
    },
    resourceDayGridMonth: {
      type: 'resourceDayGrid',
      duration: { months: 1 },
      fixedWeekCount: true,
    },
  },
  optionRefiners: OPTION_REFINERS,
  optionDefaults: OPTION_DEFAULTS,
}) as PluginDef

export * from './structs.js'
export { ResourceDayGridOptions } from './options.js'
