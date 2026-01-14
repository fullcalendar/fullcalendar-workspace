import { createPlugin, PluginDef } from '@fullcalendar/core'
import { recurringType } from './recurring-type'
import { RRULE_EVENT_REFINERS } from './event-refiners'
import './ambient'

export default createPlugin({
  name: '<%= pkgName %>',
  recurringTypes: [recurringType],
  eventRefiners: RRULE_EVENT_REFINERS,
}) as PluginDef
