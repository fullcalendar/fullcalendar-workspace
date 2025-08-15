import { createPlugin, PluginDef } from '@fullcalendar/core'
import { TableDateProfileGenerator } from '@fullcalendar/daygrid/internal'
import { MultiMonthView } from './components/MultiMonthView.js'
import { OPTION_REFINERS } from './options.js'
import './ambient.js'

export default createPlugin({
  name: '<%= pkgName %>',
  initialView: 'multiMonthYear',
  optionRefiners: OPTION_REFINERS,
  views: {
    multiMonth: {
      component: MultiMonthView,
      dateProfileGeneratorClass: TableDateProfileGenerator,
      multiMonthMaxColumns: 3,
      singleMonthMinWidth: 350,
    },
    multiMonthYear: {
      type: 'multiMonth',
      duration: { years: 1 },
      fixedWeekCount: true, // TODO: apply to all multi-col layouts?
      showNonCurrentDates: false, // TODO: looks bad when single-col layout
    },
  },
}) as PluginDef

export {
  SingleMonthData,
  SingleMonthMountData,
  SingleMonthHeaderData,
} from './structs.js'

export { MultiMonthOptions } from './options.js'
