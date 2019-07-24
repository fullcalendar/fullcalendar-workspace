
import { DEFAULT_PLUGINS } from 'package-tests/globals'
import './gpl-key'

import TimelinePlugin from '@fullcalendar/timeline'
import ResourceTimelinePlugin from '@fullcalendar/resource-timeline'
import ResourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import ResourceTimeGridPlugin from '@fullcalendar/resource-timegrid'

const MORE_DEFAULT_PLUGINS = [
  TimelinePlugin,
  ResourceTimelinePlugin,
  ResourceDayGridPlugin,
  ResourceTimeGridPlugin
]

pushOptions({
  plugins: DEFAULT_PLUGINS.concat(MORE_DEFAULT_PLUGINS)
})
