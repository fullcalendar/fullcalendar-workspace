import { Calendar as BareCalendar } from 'fullcalendar-w-react/public-components'
import { CalendarOptions, PluginDefInput } from 'fullcalendar-w-react/public-api'
import interactionPlugin from 'fullcalendar-w-react/interaction'
import dayGridPlugin from 'fullcalendar-w-react/daygrid'
import timeGridPlugin from 'fullcalendar-w-react/timegrid'
import listPlugin from 'fullcalendar-w-react/list'
import multiMonthPlugin from 'fullcalendar-w-react/multimonth'
import resourceDayGridPlugin from '@fullcalendar/react-scheduler/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/react-scheduler/resource-timegrid'
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'
import scrollGridPlugin from '@fullcalendar/react-scheduler/scrollgrid'
import timelinePlugin from '@fullcalendar/react-scheduler/timeline'
import adaptivePlugin from '@fullcalendar/react-scheduler/adaptive'

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
