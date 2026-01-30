import { /* FullCalendarElement as BareFullCalendarElement, */ PluginDefInput } from '@fullcalendar/vue3'
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

;(basePlugins || null)

export const plugins: PluginDefInput[] = [
  resourceDayGridPlugin as any, // !!!
  resourceTimeGridPlugin as any, // !!!
  resourceTimelinePlugin as any, // !!!
  scrollGridPlugin as any, // !!!
  timelinePlugin as any, // !!!
]

/*
export class FullCalendarElement extends BareFullCalendarElement {
  constructor() {
    super()
    this._forcedPlugins = [
      ...basePlugins,
      ...plugins,
    ]
  }
}
export default FullCalendarElement
*/
