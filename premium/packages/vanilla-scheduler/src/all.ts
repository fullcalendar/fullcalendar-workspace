import { Calendar as BareCalendar } from 'fullcalendar/public-components'
import { CalendarOptions, PluginInput } from 'fullcalendar/public-api'
import interactionPlugin from 'fullcalendar/interaction'
import dayGridPlugin from 'fullcalendar/daygrid'
import timeGridPlugin from 'fullcalendar/timegrid'
import listPlugin from 'fullcalendar/list'
import multiMonthPlugin from 'fullcalendar/multimonth'
import resourceDayGridPlugin from '@fullcalendar/preact-scheduler/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/preact-scheduler/resource-timegrid'
import resourceTimelinePlugin from '@fullcalendar/preact-scheduler/resource-timeline'
import scrollGridPlugin from '@fullcalendar/preact-scheduler/scrollgrid'
import timelinePlugin from '@fullcalendar/preact-scheduler/timeline'
import adaptivePlugin from '@fullcalendar/preact-scheduler/adaptive'

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

export class Calendar extends BareCalendar {
  constructor(el: HTMLElement, optionOverrides: CalendarOptions = {}) {
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
