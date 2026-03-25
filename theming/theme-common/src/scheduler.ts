import adaptivePlugin from '@fullcalendar/react-scheduler/adaptive'
import scrollGridPlugin from '@fullcalendar/react-scheduler/scrollgrid'
import timelinePlugin from '@fullcalendar/react-scheduler/timeline'
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/react-scheduler/resource-timegrid'
import resourceDayGridPlugin from '@fullcalendar/react-scheduler/resource-daygrid'

export const schedulerOnlyPlugins = [
  adaptivePlugin,
  scrollGridPlugin,
  timelinePlugin,
  resourceTimelinePlugin,
  resourceTimeGridPlugin,
  resourceDayGridPlugin,
]

export const schedulerAvailableViews = [
  'resourceTimelineDay',
  'resourceTimelineWeek',
]
