import { defineComponent, h } from 'vue'
import FullCalendar, { PluginDefInput } from '@fullcalendar/vue3'
import interactionPlugin from '@fullcalendar/vue3/interaction'
import dayGridPlugin from '@fullcalendar/vue3/daygrid'
import timeGridPlugin from '@fullcalendar/vue3/timegrid'
import listPlugin from '@fullcalendar/vue3/list'
import multiMonthPlugin from '@fullcalendar/vue3/multimonth'
import resourceDayGridPlugin from '@fullcalendar/vanilla-scheduler/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/vanilla-scheduler/resource-timegrid'
import resourceTimelinePlugin from '@fullcalendar/vanilla-scheduler/resource-timeline'
import scrollGridPlugin from '@fullcalendar/vanilla-scheduler/scrollgrid'
import timelinePlugin from '@fullcalendar/vanilla-scheduler/timeline'

const basePlugins: PluginDefInput[] = [
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
]

export const plugins: PluginDefInput[] = [
  resourceDayGridPlugin as any, // !!!
  resourceTimeGridPlugin as any, // !!!
  resourceTimelinePlugin as any, // !!!
  scrollGridPlugin as any, // !!!
  timelinePlugin as any, // !!!
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
          ...basePlugins,
          ...plugins,
          ...(props.options.plugins || []),
        ]
      }
    })
  }
})
