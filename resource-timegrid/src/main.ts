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
      component: ResourceDayTimeColsView,

      // TODO: wish we didn't have to C&P from timeGrid's file
      allDaySlot: true,
      slotDuration: '00:30:00',
      slotEventOverlap: true // a bad name. confused with overlap/constraint system
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
