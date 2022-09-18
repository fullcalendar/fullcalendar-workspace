import { createPlugin } from '@fullcalendar/core'

import { default as premiumCommonPlugin } from '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates
// ensure ambient declarations
import '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates

import { default as resourceCommonPlugin } from '@fullcalendar/resource-common'
import { default as dayGridPlugin } from '@fullcalendar/daygrid'
import { ResourceDayTableView } from './ResourceDayTableView.js'

export { ResourceDayTableView }
export { ResourceDayTable } from './ResourceDayTable.js'

export default createPlugin({
  deps: [
    premiumCommonPlugin,
    resourceCommonPlugin,
    dayGridPlugin,
  ],
  initialView: 'resourceDayGridDay',
  views: {

    resourceDayGrid: {
      type: 'dayGrid', // will inherit this configuration
      component: ResourceDayTableView,
      needsResourceData: true,
    },

    resourceDayGridDay: {
      type: 'resourceDayGrid',
      duration: { days: 1 },
    },

    resourceDayGridWeek: {
      type: 'resourceDayGrid',
      duration: { weeks: 1 },
    },

    resourceDayGridMonth: {
      type: 'resourceDayGrid',
      duration: { months: 1 },

      // TODO: wish we didn't have to C&P from dayGrid's file
      monthMode: true, // a hidden option!?
      fixedWeekCount: true,
    },

  },
})
