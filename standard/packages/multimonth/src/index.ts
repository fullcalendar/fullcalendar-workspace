import { createPlugin, PluginDef } from '@fullcalendar/core'
import { TableDateProfileGenerator } from '@fullcalendar/daygrid/internal'
import { MultiMonthView } from './components/MultiMonthView.js'
import { OPTION_REFINERS } from './options-refiners.js'
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
      singleMonthMinWidth: 375,
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
  SingleMonthContentArg,
  SingleMonthMountArg,
  SingleMonthTitleArg,
  SingleMonthTableArg,
  SingleMonthTableHeaderArg,
  SingleMonthTableBodyArg,
} from './structs.js'
