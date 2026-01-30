import { PluginDefInput } from '@fullcalendar/vanilla/public-api'
import interactionPlugin from '@fullcalendar/vanilla/interaction'
import dayGridPlugin from '@fullcalendar/vanilla/daygrid'
import timeGridPlugin from '@fullcalendar/vanilla/timegrid'
import listPlugin from '@fullcalendar/vanilla/list'
import multiMonthPlugin from '@fullcalendar/vanilla/multimonth'

export const plugins: PluginDefInput[] = [
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
]

/*
TODO: write JSX Calendar that uses all Plugins

import { CalendarOptions } from '@fullcalendar/vanilla/public-api'
import { Calendar as BareCalendar } from './Calendar' --- FullCalendar

export class Calendar extends BareCalendar {
  constructor(el: HTMLElement, optionOverrides: CalendarOptions) {
    super(el, {
      ...optionOverrides,
      plugins: [
        ...plugins,
        ...(optionOverrides.plugins || []),
      ]
    })
  }
}

export default Calendar
*/
