import { CalendarOptions } from '@fullcalendar/preact'
import { plugins } from '@fullcalendar/preact/all'
import { Calendar as BareCalendar } from './Calendar'

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

export { Calendar as default, plugins }
