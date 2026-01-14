import { createPlugin, PluginDef } from '@fullcalendar/core'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import timeGridPlugin from '@fullcalendar/timegrid'
import resourcePlugin from '@fullcalendar/resource'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import { ResourceTimeGridView } from './components/ResourceTimeGridView'
import './ambient'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [
    premiumCommonPlugin,
    timeGridPlugin,
    resourcePlugin,
    resourceDayGridPlugin,
  ],
  initialView: 'resourceTimeGridDay',
  views: {
    resourceTimeGrid: {
      type: 'timeGrid', // will inherit this configuration
      component: ResourceTimeGridView,
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
