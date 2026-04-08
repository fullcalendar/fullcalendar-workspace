import { FullCalendarElement as BareFullCalendarElement, PluginInput } from '@fullcalendar/web-component'
import interactionPlugin from '@fullcalendar/web-component/interaction'
import dayGridPlugin from '@fullcalendar/web-component/daygrid'
import timeGridPlugin from '@fullcalendar/web-component/timegrid'
import listPlugin from '@fullcalendar/web-component/list'
import multiMonthPlugin from '@fullcalendar/web-component/multimonth'
import resourceDayGridPlugin from 'fullcalendar-scheduler/resource-daygrid'
import resourceTimeGridPlugin from 'fullcalendar-scheduler/resource-timegrid'
import resourceTimelinePlugin from 'fullcalendar-scheduler/resource-timeline'
import scrollGridPlugin from 'fullcalendar-scheduler/scrollgrid'
import timelinePlugin from 'fullcalendar-scheduler/timeline'
import adaptivePlugin from 'fullcalendar-scheduler/adaptive'

const basePlugins: PluginInput[] = [
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
]

export const plugins: PluginInput[] = [
  resourceDayGridPlugin as any, // !!!
  resourceTimeGridPlugin as any, // !!!
  resourceTimelinePlugin as any, // !!!
  scrollGridPlugin as any, // !!!
  timelinePlugin as any, // !!!
  adaptivePlugin as any, // !!!
]

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
