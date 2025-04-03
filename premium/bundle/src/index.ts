import { globalPlugins } from '@fullcalendar/core'
import classicThemePlugin from '@fullcalendar/classic-theme'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import multiMonthPlugin from '@fullcalendar/multimonth'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import adaptivePlugin from '@fullcalendar/adaptive'
import timelinePlugin from '@fullcalendar/timeline'
import resourcePlugin from '@fullcalendar/resource'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'

globalPlugins.push(
  classicThemePlugin,
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
  scrollGridPlugin,
  adaptivePlugin,
  timelinePlugin,
  resourcePlugin,
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  resourceTimelinePlugin,
)

export * from '@fullcalendar/core'
export * from '@fullcalendar/interaction' // for Draggable
