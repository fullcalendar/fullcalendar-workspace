import { ReactNode } from 'react'
import { Calendar as BareCalendar } from '@fullcalendar/preact/public-components'
import { CalendarOptions, PluginDefInput } from '@fullcalendar/preact/public-api'
import interactionPlugin from '@fullcalendar/preact/interaction'
import dayGridPlugin from '@fullcalendar/preact/daygrid'
import timeGridPlugin from '@fullcalendar/preact/timegrid'
import listPlugin from '@fullcalendar/preact/list'
import multiMonthPlugin from '@fullcalendar/preact/multimonth'
import resourceDayGridPlugin from './resource-daygrid/plugin'
import resourceTimeGridPlugin from './resource-timegrid/plugin'
import resourceTimelinePlugin from './resource-timeline/plugin'
import scrollGridPlugin from './scrollgrid/plugin'
import timelinePlugin from './timeline/plugin'
import adaptivePlugin from './adaptive/plugin'

import './ambient'
import './side-effects'

const basePlugins: PluginDefInput[] = [
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
]

export const plugins: PluginDefInput[] = [
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  resourceTimelinePlugin,
  scrollGridPlugin,
  timelinePlugin,
  adaptivePlugin,
]

export function Calendar(options: CalendarOptions = {}): ReactNode {
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
