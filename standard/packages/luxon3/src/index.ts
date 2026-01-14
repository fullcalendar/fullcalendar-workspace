import { createPlugin, PluginDef } from '@fullcalendar/core'
import { LuxonNamedTimeZone } from './LuxonNamedTimeZone'
import { formatWithCmdStr } from './format'

export default createPlugin({
  name: '<%= pkgName %>',
  cmdFormatter: formatWithCmdStr,
  namedTimeZonedImpl: LuxonNamedTimeZone,
}) as PluginDef

export { toLuxonDateTime, toLuxonDuration } from './convert'
