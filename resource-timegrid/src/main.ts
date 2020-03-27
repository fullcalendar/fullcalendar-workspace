import { createPlugin } from '@fullcalendar/core'
import ResourceCommonPlugin from '@fullcalendar/resource-common'
import TimeGridPlugin from '@fullcalendar/timegrid'
import ResourceDayTimeColsView from './ResourceDayTimeColsView'

export { ResourceDayTimeColsView }
export { default as ResourceDayTimeCols } from './ResourceDayTimeCols'

export default createPlugin({
  deps: [ ResourceCommonPlugin, TimeGridPlugin ],
  defaultView: 'resourceTimeGridDay',
  views: {

    resourceTimeGrid: {
      type: 'timeGrid', // will inherit this configuration
      component: ResourceDayTimeColsView,
      needsResourceData: true
    },

    resourceTimeGridDay: {
      type: 'resourceTimeGrid',
      duration: { days: 1 }
    },

    resourceTimeGridWeek: {
      type: 'resourceTimeGrid',
      duration: { weeks: 1 }
    }

  }
})
