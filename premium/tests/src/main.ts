import 'fullcalendar-tests/src/lib/globals'
import { DEFAULT_PLUGINS } from 'fullcalendar-tests/src/lib/install-plugins'

import scrollGridPlugin from '@fullcalendar/scrollgrid'
import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'

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

// all of the non-lib .js files within subdirectories will be automatically included...
