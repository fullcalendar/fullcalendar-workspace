import { globalPlugins } from '@fullcalendar/web-component'
import resourceDayGridPlugin from '@fullcalendar/vanilla-scheduler/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/vanilla-scheduler/resource-timegrid'
import resourceTimelinePlugin from '@fullcalendar/vanilla-scheduler/resource-timeline'
import scrollGridPlugin from '@fullcalendar/vanilla-scheduler/scrollgrid'
import timelinePlugin from '@fullcalendar/vanilla-scheduler/timeline'

globalPlugins.push(
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  resourceTimelinePlugin,
  scrollGridPlugin,
  timelinePlugin,
)
