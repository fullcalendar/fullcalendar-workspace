import { createPlugin, PluginDef } from '@fullcalendar/core'
import { eventSourceDef } from './event-source-def'

export default createPlugin({
  name: '<%= pkgName %>',
  eventSourceDefs: [eventSourceDef],
}) as PluginDef
