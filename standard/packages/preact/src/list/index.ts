import { createPlugin, PluginDef } from '../plugin-system-struct'
import { ListView } from './components/ListView'
import { OPTION_REFINERS } from './options'
import './ambient'

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

export * from './public-types'
