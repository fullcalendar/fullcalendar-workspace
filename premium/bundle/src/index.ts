import { globalPlugins } from '@fullcalendar/core'
import { default as interactionPlugin } from '@fullcalendar/interaction'
import { default as dayGridPlugin } from '@fullcalendar/daygrid'
import { default as timeGridPlugin } from '@fullcalendar/timegrid'
import { default as listPlugin } from '@fullcalendar/list'
import { default as scrollGridPlugin } from '@fullcalendar/scrollgrid'
import { default as adaptivePlugin } from '@fullcalendar/adaptive'
import { default as timelinePlugin } from '@fullcalendar/timeline'
import { default as resourceCommonPlugin } from '@fullcalendar/resource-common'
import { default as resourceDayGridPlugin } from '@fullcalendar/resource-daygrid'
import { default as resourceTimeGridPlugin } from '@fullcalendar/resource-timegrid'
import { default as resourceTimelinePlugin } from '@fullcalendar/resource-timeline'

globalPlugins.push(
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  scrollGridPlugin,
  adaptivePlugin,
  timelinePlugin,
  resourceCommonPlugin,
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  resourceTimelinePlugin,
)

export * from '@fullcalendar/core'
export * from '@fullcalendar/interaction' // for Draggable
