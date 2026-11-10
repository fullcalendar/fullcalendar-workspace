import '@fullcalendar-tests/standard/src/lib/setup'
import scrollGridPlugin from 'fullcalendar-scheduler/scrollgrid'
import timelinePlugin from 'fullcalendar-scheduler/timeline'
import resourceTimelinePlugin from 'fullcalendar-scheduler/resource-timeline'
import resourceDayGridPlugin from 'fullcalendar-scheduler/resource-daygrid'
import resourceTimeGridPlugin from 'fullcalendar-scheduler/resource-timegrid'
import { addDefaults } from '@fullcalendar-tests/standard/src/lib/calendar'
import { createPartsPlugin, SCHEDULER_PART_NAMES } from '@fullcalendar-tests/standard/src/lib/parts'

addDefaults(
  [
    scrollGridPlugin,
    timelinePlugin,
    resourceTimelinePlugin,
    resourceDayGridPlugin,
    resourceTimeGridPlugin,
    createPartsPlugin('test-scheduler-parts', SCHEDULER_PART_NAMES),
  ],
  {
    // a preset key, so the invalid-license banner never covers cells. license tests override it
    schedulerLicenseKey: 'AGPL-My-Frontend-And-Backend-Are-Open-Source',
  },
)
