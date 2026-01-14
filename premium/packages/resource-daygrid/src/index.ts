import { createPlugin, PluginDef } from '@fullcalendar/core'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import resourcePlugin from '@fullcalendar/resource'
import dayGridPlugin from '@fullcalendar/daygrid'
import { ResourceDayGridView } from './components/ResourceDayGridView'
import { OPTION_DEFAULTS, OPTION_REFINERS } from './options'
import './ambient'

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

export * from './structs'
export { ResourceDayGridOptions } from './options'
