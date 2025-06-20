import { createPlugin, PluginDef } from '@fullcalendar/core'
import { DayGridView } from './components/DayGridView.js'
import { TableDateProfileGenerator } from './TableDateProfileGenerator.js'
import { OPTION_DEFAULTS, OPTION_REFINERS } from './options.js'
import './ambient.js'

export default createPlugin({
  name: '<%= pkgName %>',
  initialView: 'dayGridMonth',
  optionRefiners: OPTION_REFINERS,
  optionDefaults: OPTION_DEFAULTS,
  views: {
    dayGrid: {
      component: DayGridView,
      dateProfileGeneratorClass: TableDateProfileGenerator,
    },
    dayGridDay: {
      type: 'dayGrid',
      duration: { days: 1 },
    },
    dayGridWeek: {
      type: 'dayGrid',
      duration: { weeks: 1 },
    },
    dayGridMonth: {
      type: 'dayGrid',
      duration: { months: 1 },
      fixedWeekCount: true,
    },
    dayGridYear: {
      type: 'dayGrid',
      duration: { years: 1 },
    },
  },
}) as PluginDef

export {
  DayCellData,
  DayCellMountData,
} from './structs.js'

export { DayGridOptions } from './options.js'
