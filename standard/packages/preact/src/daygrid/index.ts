import { createPlugin } from '../plugin-system'
import { PluginDef } from '../plugin-system-struct'
import { DayGridView } from './components/DayGridView'
import { TableDateProfileGenerator } from './TableDateProfileGenerator'
import { OPTION_DEFAULTS, OPTION_REFINERS } from './options'
import './ambient'

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

export { DayGridOptions } from './options'
