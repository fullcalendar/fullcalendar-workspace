import { PluginDef } from '@fullcalendar/core'
import classicThemePlugin from '@fullcalendar/classic-theme'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import multiMonthPlugin from '@fullcalendar/multimonth'

export const DEFAULT_PLUGINS: PluginDef[] = [
  classicThemePlugin,
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
]

pushOptions({
  plugins: DEFAULT_PLUGINS,
})
