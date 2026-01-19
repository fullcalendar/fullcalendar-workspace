import { ReactNode } from 'react'
import { Calendar as BareCalendar } from './Calendar'
import { CalendarOptions } from './options'
import interactionPlugin from './interaction'
import dayGridPlugin from './daygrid'
import timeGridPlugin from './timegrid'
import listPlugin from './list'
import multiMonthPlugin from './multimonth'

export function Calendar(options: CalendarOptions): ReactNode {
  return (
    <BareCalendar
      {...options}
      plugins={[
        interactionPlugin,
        dayGridPlugin,
        timeGridPlugin,
        listPlugin,
        multiMonthPlugin,
        ...(options.plugins || []),
      ]}
    />
  )
}
