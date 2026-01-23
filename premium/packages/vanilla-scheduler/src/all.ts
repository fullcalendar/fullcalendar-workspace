import { Calendar as BareCalendar } from '@fullcalendar/vanilla/public-components'
import { CalendarOptions, PluginDefInput } from '@fullcalendar/vanilla/public-api'
import interactionPlugin from '@fullcalendar/vanilla/interaction'
import dayGridPlugin from '@fullcalendar/vanilla/daygrid'
import timeGridPlugin from '@fullcalendar/vanilla/timegrid'
import listPlugin from '@fullcalendar/vanilla/list'
import multiMonthPlugin from '@fullcalendar/vanilla/multimonth'
import resourceDayGridPlugin from '@fullcalendar/preact-scheduler/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/preact-scheduler/resource-timegrid'
import resourceTimelinePlugin from '@fullcalendar/preact-scheduler/resource-timeline'
import scrollGridPlugin from '@fullcalendar/preact-scheduler/scrollgrid'
import timelinePlugin from '@fullcalendar/preact-scheduler/timeline'

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

export class Calendar extends BareCalendar {
  constructor(el: HTMLElement, optionOverrides: CalendarOptions) {
    super(el, {
      ...optionOverrides,
      plugins: [
        ...basePlugins,
        ...plugins,
        ...(optionOverrides.plugins || []),
      ] as any // !!!
    })
  }
}

export default Calendar
