import { globalPlugins } from 'fullcalendar/public-api'
import resourceDayGridPlugin from 'fullcalendar-scheduler/resource-daygrid'
import resourceTimeGridPlugin from 'fullcalendar-scheduler/resource-timegrid'
import resourceTimelinePlugin from 'fullcalendar-scheduler/resource-timeline'
import scrollGridPlugin from 'fullcalendar-scheduler/scrollgrid'
import timelinePlugin from 'fullcalendar-scheduler/timeline'

globalPlugins.push(
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  resourceTimelinePlugin,
  scrollGridPlugin,
  timelinePlugin,
)
