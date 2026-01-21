import { Calendar as BareCalendar } from '@fullcalendar/vanilla/public-components'
import { CalendarOptions } from '@fullcalendar/vanilla/public-api'
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

export class Calendar extends BareCalendar {
  constructor(el: HTMLElement, optionOverrides: CalendarOptions) {
    super(el, {
      ...optionOverrides,
      plugins: [
        ...basePlugins,
        ...plugins,
        ...(optionOverrides.plugins || []),
      ]
    })
  }
}

export default Calendar
