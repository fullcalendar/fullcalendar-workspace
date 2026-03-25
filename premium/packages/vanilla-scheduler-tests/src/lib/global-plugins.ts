import { PluginDefInput } from 'fullcalendar'
import scrollGridPlugin from 'fullcalendar-scheduler/scrollgrid'
import timelinePlugin from 'fullcalendar-scheduler/timeline'
import resourceTimelinePlugin from 'fullcalendar-scheduler/resource-timeline'
import resourceDayGridPlugin from 'fullcalendar-scheduler/resource-daygrid'
import resourceTimeGridPlugin from 'fullcalendar-scheduler/resource-timegrid'
import { DEFAULT_PLUGINS } from '@fullcalendar-tests/standard/lib/global-plugins'
import themeForTestsPremiumPlugin from './theme-for-tests-premium'
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
