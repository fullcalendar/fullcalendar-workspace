
import 'standard-tests/src/lib/globals'
import { DEFAULT_PLUGINS } from 'standard-tests/src/lib/install-plugins'
import './lib/gpl-key'

import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'

const MORE_DEFAULT_PLUGINS = [
  timelinePlugin,
  resourceTimelinePlugin,
  resourceDayGridPlugin,
  resourceTimeGridPlugin
]

pushOptions({
  plugins: DEFAULT_PLUGINS.concat(MORE_DEFAULT_PLUGINS)
})

// all of the non-lib .js files within subdirectories will be automatically included...
