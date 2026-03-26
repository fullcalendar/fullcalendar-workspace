import { globalPlugins } from '@fullcalendar/preact/public-api'
import resourceDayGridPlugin from '@fullcalendar/preact-scheduler/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/preact-scheduler/resource-timegrid'
import resourceTimelinePlugin from '@fullcalendar/preact-scheduler/resource-timeline'
import scrollGridPlugin from '@fullcalendar/preact-scheduler/scrollgrid'
import timelinePlugin from '@fullcalendar/preact-scheduler/timeline'
import adaptivePlugin from '@fullcalendar/preact-scheduler/adaptive'

globalPlugins.push(
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  resourceTimelinePlugin,
  scrollGridPlugin,
  timelinePlugin,
  adaptivePlugin,
)
