import '@fullcalendar/standard-tests/src/lib/globals'
import { DEFAULT_PLUGINS } from '@fullcalendar/standard-tests/src/lib/install-plugins'

import { default as scrollGridPlugin } from '@fullcalendar/scrollgrid'
import { default as timelinePlugin } from '@fullcalendar/timeline'
import { default as resourceTimelinePlugin } from '@fullcalendar/resource-timeline'
import { default as resourceDayGridPlugin } from '@fullcalendar/resource-daygrid'
import { default as resourceTimeGridPlugin } from '@fullcalendar/resource-timegrid'

const MORE_DEFAULT_PLUGINS = [
  scrollGridPlugin,
  timelinePlugin,
  resourceTimelinePlugin,
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
]

pushOptions({
  plugins: DEFAULT_PLUGINS.concat(MORE_DEFAULT_PLUGINS),
})
