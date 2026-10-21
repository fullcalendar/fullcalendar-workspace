import { tableRenderRange } from '../day-table/render-range'
import { PluginInput } from '../plugins/plugin-types'
import { MultiMonthView } from './components/MultiMonthView'

export default {
  name: 'multimonth',
  initialView: 'multiMonthYear',
  views: {
    multiMonth: {
      component: MultiMonthView,
      dateProfileRenderRange: tableRenderRange,
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
} as PluginInput
