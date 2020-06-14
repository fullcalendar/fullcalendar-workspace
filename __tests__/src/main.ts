
import 'fullcalendar-tests/lib/globals'
import { DEFAULT_PLUGINS } from 'fullcalendar-tests/lib/install-plugins'

import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'

// needs this for correct types for schedulerLicenseKey, but why?
// shouldn't including * -> resource-common -> premium-common do this?
// when this line is no longer needed, remove from package.json and tsconfig.json
import '@fullcalendar/premium-common'

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
