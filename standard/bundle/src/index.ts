import '@fullcalendar/core/global.css'
import '@fullcalendar/classic-theme/global.css'

import { globalPlugins } from '@fullcalendar/core'
import classicThemePlugin from '@fullcalendar/classic-theme'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import multiMonthPlugin from '@fullcalendar/multimonth'

globalPlugins.push(
  classicThemePlugin,
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
)

export * from '@fullcalendar/core'
export * from '@fullcalendar/interaction' // for Draggable
