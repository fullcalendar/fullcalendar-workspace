import { PluginDefInput } from '@fullcalendar/vanilla'
import classicThemePlugin from '@fullcalendar/vanilla/themes/classic' // need both
import themeForTestsPlugin from './theme-for-tests.js' // "
import interactionPlugin from '@fullcalendar/vanilla/interaction'
import dayGridPlugin from '@fullcalendar/vanilla/daygrid'
import timeGridPlugin from '@fullcalendar/vanilla/timegrid'
import listPlugin from '@fullcalendar/vanilla/list'
import multiMonthPlugin from '@fullcalendar/vanilla/multimonth'
import { pushOptions } from './global-utils.js'

export const DEFAULT_PLUGINS: PluginDefInput[] = [
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
