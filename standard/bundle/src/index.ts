import '@fullcalendar/core/global.css'

import { globalPlugins } from '@fullcalendar/core'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import multiMonthPlugin from '@fullcalendar/multimonth'

globalPlugins.push(
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
)

export { globalPlugins } // HACK to ensure side-effect isn't tree-shaken
export * from '@fullcalendar/core'
export * from '@fullcalendar/interaction' // for Draggable
