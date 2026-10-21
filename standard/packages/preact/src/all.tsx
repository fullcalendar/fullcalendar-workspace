import { ReactNode } from 'react'
import { Calendar as BareCalendar } from './calendar/Calendar'
import { CalendarOptions } from './options/options'
import { PluginInput } from './plugins/plugin-types'
import interactionPlugin from './interaction-plugin/index'
import dayGridPlugin from './daygrid/index'
import timeGridPlugin from './timegrid/index'
import listPlugin from './list/index'
import multiMonthPlugin from './multimonth/index'

export const plugins: PluginInput[] = [
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
]

export function Calendar(options: CalendarOptions = {}): ReactNode {
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
