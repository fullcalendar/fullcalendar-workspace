
import defaultPlugins from 'test-lib/default-plugins'
import './lib/gpl-key'

import TimelinePlugin from '@fullcalendar/timeline'
import ResourceTimelinePlugin from '@fullcalendar/resource-timeline'
import ResourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import ResourceTimeGridPlugin from '@fullcalendar/resource-timegrid'

const moreDefaultPlugins = [
  TimelinePlugin,
  ResourceTimelinePlugin,
  ResourceDayGridPlugin,
  ResourceTimeGridPlugin
]

pushOptions({
  plugins: defaultPlugins.concat(moreDefaultPlugins)
})

// all of the non-lib .js files within subdirectories will be automatically included...
