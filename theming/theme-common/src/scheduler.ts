import { CalendarOptions } from '@fullcalendar/core'
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'

export interface SchedulerProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

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
