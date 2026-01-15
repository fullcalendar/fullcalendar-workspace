
import { globalPlugins } from './global-plugins'
import interactionPlugin from './interaction'
import dayGridPlugin from './daygrid'
import timeGridPlugin from './timegrid'
import listPlugin from './list'
import multiMonthPlugin from './multimonth'

globalPlugins.push(
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
)
