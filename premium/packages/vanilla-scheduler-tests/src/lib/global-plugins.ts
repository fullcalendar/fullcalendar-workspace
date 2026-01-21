import { PluginDef } from '@fullcalendar/core'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import { DEFAULT_PLUGINS } from '@fullcalendar-tests/standard/lib/global-plugins'
import themeForTestsPremiumPlugin from './theme-for-tests-premium.js'

const MORE_DEFAULT_PLUGINS: PluginDef[] = [
  scrollGridPlugin,
  timelinePlugin,
  resourceTimelinePlugin,
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  themeForTestsPremiumPlugin,
]

pushOptions({
  plugins: DEFAULT_PLUGINS.concat(MORE_DEFAULT_PLUGINS),
})
