import { createPlugin, PluginDef } from '@fullcalendar/core'
import { MomentNamedTimeZone } from './MomentNamedTimeZone'

export default createPlugin({
  name: '<%= pkgName %>',
  namedTimeZonedImpl: MomentNamedTimeZone,
}) as PluginDef
