import { globalPlugins } from '@fullcalendar/core'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import bootstrapPlugin from '@fullcalendar/bootstrap'
import bootstrap5Plugin from '@fullcalendar/bootstrap5'
import googleCalendarPlugin from '@fullcalendar/google-calendar'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import adaptivePlugin from '@fullcalendar/adaptive'
import timelinePlugin from '@fullcalendar/timeline'
import resourceCommonPlugin from '@fullcalendar/resource-common'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'

globalPlugins.push(
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  bootstrapPlugin,
  bootstrap5Plugin,
  googleCalendarPlugin,
  scrollGridPlugin,
  adaptivePlugin,
  timelinePlugin,
  resourceCommonPlugin,
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  resourceTimelinePlugin,
)

export * from '@fullcalendar/core'
export * from '@fullcalendar/interaction'
export * from '@fullcalendar/daygrid'
export * from '@fullcalendar/timegrid'
export * from '@fullcalendar/list'
export * from '@fullcalendar/bootstrap' // bootstrap5 not exported
export * from '@fullcalendar/google-calendar'
export * from '@fullcalendar/scrollgrid'
export * from '@fullcalendar/adaptive'
export * from '@fullcalendar/timeline'
export * from '@fullcalendar/resource-common'
export * from '@fullcalendar/resource-daygrid'
export * from '@fullcalendar/resource-timegrid'
export * from '@fullcalendar/resource-timeline'
