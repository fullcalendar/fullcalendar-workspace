import { createPlugin, PluginDef } from '@fullcalendar/preact'
import timeGridPlugin from '@fullcalendar/preact/timegrid'
import premiumCommonPlugin from '../common/plugin'
import resourcePlugin from '../resource/plugin'
import resourceDayGridPlugin from '../resource-daygrid/plugin'
import { ResourceTimeGridView } from './components/ResourceTimeGridView'

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
