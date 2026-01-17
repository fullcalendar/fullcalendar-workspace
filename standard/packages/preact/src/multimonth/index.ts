import { createPlugin } from '../plugin-system'
import { PluginDef } from '../plugin-system-struct'
import { TableDateProfileGenerator } from '../daygrid/TableDateProfileGenerator'
import { MultiMonthView } from './components/MultiMonthView'

export default createPlugin({
  name: 'multimonth',
  initialView: 'multiMonthYear',
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
