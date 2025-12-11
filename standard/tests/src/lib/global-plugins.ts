import { PluginDef } from '@fullcalendar/core'
import classicThemePlugin from '@fullcalendar/theme-classic' // NOTE: css imported in global.ts
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import multiMonthPlugin from '@fullcalendar/multimonth'
import themeForTestsPlugin from './theme-for-tests.js'

export const DEFAULT_PLUGINS: PluginDef[] = [
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
  classicThemePlugin,
  themeForTestsPlugin,
]

pushOptions({
  plugins: DEFAULT_PLUGINS,
})
