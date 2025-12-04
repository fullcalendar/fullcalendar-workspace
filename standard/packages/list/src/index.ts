import { createPlugin, PluginDef } from '@fullcalendar/core'
import { ListView } from './components/ListView.js'
import { OPTION_REFINERS } from './options.js'
import './ambient.js'

export default createPlugin({
  name: '<%= pkgName %>',
  optionRefiners: OPTION_REFINERS,
  views: {
    list: {
      component: ListView,
      buttonTextKey: 'listText', // what to lookup in locale files
    },
    listDay: {
      type: 'list',
      duration: { days: 1 },
    },
    listWeek: {
      type: 'list',
      duration: { weeks: 1 },
    },
    listMonth: {
      type: 'list',
      duration: { month: 1 },
    },
    listYear: {
      type: 'list',
      duration: { year: 1 },
    },
  },
}) as PluginDef

export * from './public-types.js'
