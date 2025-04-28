import { createPlugin, PluginDef } from '@fullcalendar/core'
import { TimeGridView } from './components/TimeGridView.js'
import { OPTION_REFINERS } from './options.js'
import './ambient.js'

export default createPlugin({
  name: '<%= pkgName %>',
  initialView: 'timeGridWeek',
  optionRefiners: OPTION_REFINERS,
  views: {
    timeGrid: {
      component: TimeGridView,
      usesMinMaxTime: true, // indicates that slotMinTime/slotMaxTime affects rendering
      allDaySlot: true,
      slotDuration: '00:30:00',
      slotEventOverlap: true, // a bad name. confused with overlap/constraint system
    },
    timeGridDay: {
      type: 'timeGrid',
      duration: { days: 1 },
    },
    timeGridWeek: {
      type: 'timeGrid',
      duration: { weeks: 1 },
    },
  },
}) as PluginDef

export { TimeGridOptions } from './options.js'
