
import 'fullcalendar-tests/lib/globals'
import { DEFAULT_PLUGINS } from 'fullcalendar-tests/lib/install-plugins'
import './lib/gpl-key'

import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import premiumCommonPlugin from '@fullcalendar/premium-common'
  // need this for schedulerLicenseKey but why? shouldn't deps include this?

const MORE_DEFAULT_PLUGINS = [
  timelinePlugin,
  resourceTimelinePlugin,
  resourceDayGridPlugin,
  resourceTimeGridPlugin,
  premiumCommonPlugin
]

pushOptions({
  plugins: DEFAULT_PLUGINS.concat(MORE_DEFAULT_PLUGINS)
})

// all of the non-lib .js files within subdirectories will be automatically included...
