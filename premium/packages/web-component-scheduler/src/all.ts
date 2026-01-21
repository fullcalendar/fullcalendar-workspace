import { FullCalendarElement as BareFullCalendarElement } from '@fullcalendar/web-component'
import interactionPlugin from '@fullcalendar/web-component/interaction'
import dayGridPlugin from '@fullcalendar/web-component/daygrid'
import timeGridPlugin from '@fullcalendar/web-component/timegrid'
import listPlugin from '@fullcalendar/web-component/list'
import multiMonthPlugin from '@fullcalendar/web-component/multimonth'
import resourceDayGridPlugin from '@fullcalendar/vanilla-scheduler/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/vanilla-scheduler/resource-timegrid'
import resourceTimelinePlugin from '@fullcalendar/vanilla-scheduler/resource-timeline'
import scrollGridPlugin from '@fullcalendar/vanilla-scheduler/scrollgrid'
import timelinePlugin from '@fullcalendar/vanilla-scheduler/timeline'

const basePlugins = [
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
]

export const plugins = [
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  resourceTimelinePlugin,
  scrollGridPlugin,
  timelinePlugin,
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
