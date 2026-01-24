import { PluginDefInput } from '@fullcalendar/vanilla'
import scrollGridPlugin from '@fullcalendar/vanilla-scheduler/scrollgrid'
import timelinePlugin from '@fullcalendar/vanilla-scheduler/timeline'
import resourceTimelinePlugin from '@fullcalendar/vanilla-scheduler/resource-timeline'
import resourceDayGridPlugin from '@fullcalendar/vanilla-scheduler/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/vanilla-scheduler/resource-timegrid'
import { DEFAULT_PLUGINS } from '@fullcalendar-tests/standard/lib/global-plugins'
import themeForTestsPremiumPlugin from './theme-for-tests-premium.js'
import { pushOptions } from '@fullcalendar-tests/standard/lib/global-utils'

const MORE_DEFAULT_PLUGINS: PluginDefInput[] = [
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
