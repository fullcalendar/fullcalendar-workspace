import { CalendarOptions, createPlugin, PluginDef } from '@fullcalendar/core'
// import * as svgIcons from './svgIcons.js'

// Will import ambient types during dev but strip out for build
import type {} from '@fullcalendar/timegrid'
import type {} from '@fullcalendar/timeline'
import type {} from '@fullcalendar/list'
import type {} from '@fullcalendar/multimonth'
import type {} from '@fullcalendar/resource-daygrid'
import type {} from '@fullcalendar/resource-timeline'

// applies to DayGrid, TimeGrid ALL-DAY, MultiMonth
const dayGridClasses: CalendarOptions = {
}

export default createPlugin({
  name: '<%= pkgName %>', // TODO
  optionDefaults: {
    eventColor: 'var(--color-red-500)',
    eventContrastColor: 'var(--color-white)',
    backgroundEventColor: 'var(--color-green-500)',
  },
  views: {
    dayGrid: {
      ...dayGridClasses,
    },
    multiMonth: {
      ...dayGridClasses,
    },
    timeGrid: {
      ...dayGridClasses,
    },
    timeline: {
    },
    list: {
    },
  },
}) as PluginDef
