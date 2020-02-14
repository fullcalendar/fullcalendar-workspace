
import 'test-lib/globals'
import './lib/gpl-key'
import DEFAULT_PLUGINS from 'test-lib/install-plugins'

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

// all of the non-lib .js files within subdirectories will be automatically included...
