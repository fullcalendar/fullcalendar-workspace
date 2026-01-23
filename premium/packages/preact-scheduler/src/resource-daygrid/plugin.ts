import { PluginDefInput } from '@fullcalendar/preact/public-api'
import premiumCommonPlugin from '../common/plugin'
import resourcePlugin from '../resource/plugin'
import dayGridPlugin from '@fullcalendar/preact/daygrid'
import { ResourceDayGridView } from './components/ResourceDayGridView'
import { OPTION_DEFAULTS, OPTION_REFINERS } from './options'

export default {
  name: 'resource-daygrid',
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
} as PluginDefInput
