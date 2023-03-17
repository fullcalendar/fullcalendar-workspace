import { createPlugin, PluginDef } from '@fullcalendar/core'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import resourcePlugin from '@fullcalendar/resource'
import timeGridPlugin from '@fullcalendar/timegrid'
import { ResourceDayTimeColsView } from './ResourceDayTimeColsView.js'
import './ambient.js'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [
    premiumCommonPlugin,
    resourcePlugin,
    timeGridPlugin,
  ],
  initialView: 'resourceTimeGridDay',
  views: {
    resourceTimeGrid: {
      type: 'timeGrid', // will inherit this configuration
      component: ResourceDayTimeColsView,
      needsResourceData: true,
    },
    resourceTimeGridDay: {
      type: 'resourceTimeGrid',
      duration: { days: 1 },
    },
    resourceTimeGridWeek: {
      type: 'resourceTimeGrid',
      duration: { weeks: 1 },
    },
  },
}) as PluginDef
