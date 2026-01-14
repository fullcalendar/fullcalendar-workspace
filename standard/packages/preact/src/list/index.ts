import { createPlugin } from '../plugin-system'
import { PluginDef } from '../plugin-system-struct'
import { ListView } from './components/ListView'

export default createPlugin({
  name: '<%= pkgName %>',
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
