import { ReactNode } from 'react'
import { CalendarOptions } from '@fullcalendar/preact'
import { Calendar as StandardCalendar } from '@fullcalendar/preact/all'
import resourceDayGridPlugin from './resource-daygrid'
import resourceTimeGridPlugin from './resource-timegrid'
import resourceTimelinePlugin from './resource-timeline'
import scrollGridPlugin from './scrollgrid'
import timelinePlugin from './timeline'

export const plugins = [
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  resourceTimelinePlugin,
  scrollGridPlugin,
  timelinePlugin,
]

export function Calendar(options: CalendarOptions): ReactNode {
  return (
    <StandardCalendar
      {...options}
      plugins={[
        ...plugins,
        ...(options.plugins || []),
      ]}
    />
  )
}

export default Calendar
