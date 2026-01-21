import { ReactNode } from 'react'
import { Calendar as BareCalendar } from '@fullcalendar/preact/public-components'
import { CalendarOptions, PluginDef } from '@fullcalendar/preact/public-api'
import interactionPlugin from '@fullcalendar/preact/interaction'
import dayGridPlugin from '@fullcalendar/preact/daygrid'
import timeGridPlugin from '@fullcalendar/preact/timegrid'
import listPlugin from '@fullcalendar/preact/list'
import multiMonthPlugin from '@fullcalendar/preact/multimonth'
import resourceDayGridPlugin from './resource-daygrid'
import resourceTimeGridPlugin from './resource-timegrid'
import resourceTimelinePlugin from './resource-timeline'
import scrollGridPlugin from './scrollgrid'
import timelinePlugin from './timeline'

const basePlugins: PluginDef[] = [
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
]

export const plugins: PluginDef[] = [
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  resourceTimelinePlugin,
  scrollGridPlugin,
  timelinePlugin,
]

export function Calendar(options: CalendarOptions): ReactNode {
  return (
    <BareCalendar
      {...options}
      plugins={[
        ...basePlugins,
        ...plugins,
        ...(options.plugins || []),
      ]}
    />
  )
}

export default Calendar
