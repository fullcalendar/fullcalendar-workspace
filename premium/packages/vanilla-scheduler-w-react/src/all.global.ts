import { globalPlugins } from '@fullcalendar/react/public-api'
import resourceDayGridPlugin from '@fullcalendar/react-scheduler/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/react-scheduler/resource-timegrid'
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'
import scrollGridPlugin from '@fullcalendar/react-scheduler/scrollgrid'
import timelinePlugin from '@fullcalendar/react-scheduler/timeline'
import adaptivePlugin from '@fullcalendar/react-scheduler/adaptive'

globalPlugins.push(
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  resourceTimelinePlugin,
  scrollGridPlugin,
  timelinePlugin,
  adaptivePlugin,
)
