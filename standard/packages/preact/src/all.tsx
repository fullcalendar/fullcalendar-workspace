import { ReactNode } from 'react'
import { Calendar as BareCalendar } from './Calendar'
import { CalendarOptions } from './options'
import interactionPlugin from './interaction'
import dayGridPlugin from './daygrid'
import timeGridPlugin from './timegrid'
import listPlugin from './list'
import multiMonthPlugin from './multimonth'

export const plugins = [
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
]

export function Calendar(options: CalendarOptions): ReactNode {
  return (
    <BareCalendar
      {...options}
      plugins={[
        ...plugins,
        ...(options.plugins || []),
      ]}
    />
  )
}

export default Calendar
