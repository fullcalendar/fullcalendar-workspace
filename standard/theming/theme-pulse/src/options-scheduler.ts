import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { EventCalendarOptionParams } from './options-event-calendar.js'

// ambient types
// TODO: make these all peer deps? or wait, move options to just core
import '@fullcalendar/timeline'
import '@fullcalendar/resource-daygrid'
import '@fullcalendar/resource-timegrid'
import '@fullcalendar/resource-timeline'
import '@fullcalendar/adaptive'
import '@fullcalendar/scrollgrid'

export function createSchedulerOnlyOptions({}: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  return {
    optionDefaults: {
    },
    views: {
      timeline: {
      },
    },
  }
}
