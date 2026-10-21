import { PluginInput } from '../plugins/plugin-types'
import { DayGridView } from './components/DayGridView'
import { tableRenderRange } from '../day-table/render-range'

export default {
  name: 'daygrid',
  initialView: 'dayGridMonth',
  views: {
    dayGrid: {
      component: DayGridView,
      dateProfileRenderRange: tableRenderRange,
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
} as PluginInput
