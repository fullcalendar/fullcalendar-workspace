import { createPlugin, PluginDef } from '@fullcalendar/core'
import { eventSourceDef } from './event-source-def.js'
import { OPTION_REFINERS, EVENT_SOURCE_REFINERS } from './options.js'
import './ambient.js'

export default createPlugin({
  name: '<%= pkgName %>',
  eventSourceDefs: [eventSourceDef],
  optionRefiners: OPTION_REFINERS,
  eventSourceRefiners: EVENT_SOURCE_REFINERS,
}) as PluginDef

export { GoogleCalendarOptions } from './options.js'
