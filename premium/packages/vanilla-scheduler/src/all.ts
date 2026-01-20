import { CalendarOptions } from '@fullcalendar/preact'
import { plugins } from '@fullcalendar/preact-scheduler/all'
import { Calendar as StandardCalendar } from '@fullcalendar/vanilla/all'

export class Calendar extends StandardCalendar {
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

export { Calendar as default, plugins }
