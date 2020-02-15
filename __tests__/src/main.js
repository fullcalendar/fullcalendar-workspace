
import 'standard-tests/src/lib/globals'
import DEFAULT_PLUGINS from 'standard-tests/src/lib/install-plugins'
import './lib/gpl-key'

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
