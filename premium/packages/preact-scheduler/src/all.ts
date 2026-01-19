import { CalendarComponent, globalPlugins } from '@fullcalendar/preact'
import '@fullcalendar/preact/all'

import resourceDayGridPlugin from './resource-daygrid'
import resourceTimeGridPlugin from './resource-timegrid'
import resourceTimelinePlugin from './resource-timeline'
import scrollGridPlugin from './scrollgrid'
import timelinePlugin from './timeline'

globalPlugins.push(
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  resourceTimelinePlugin,
  scrollGridPlugin,
  timelinePlugin,
)

// rethink this
export { CalendarComponent }
