import { defineComponent, h } from 'vue'
import { PluginDefInput } from '@fullcalendar/vanilla/public-api'
import interactionPlugin from '@fullcalendar/vanilla/interaction'
import dayGridPlugin from '@fullcalendar/vanilla/daygrid'
import timeGridPlugin from '@fullcalendar/vanilla/timegrid'
import listPlugin from '@fullcalendar/vanilla/list'
import multiMonthPlugin from '@fullcalendar/vanilla/multimonth'
import FullCalendar from './FullCalendar'

export const plugins: PluginDefInput[] = [
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
]

export default defineComponent({
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    return () => h(FullCalendar, {
      options: {
        ...props.options,
        plugins: [
          ...plugins,
          ...(props.options.plugins || []),
        ]
      }
    })
  }
})
