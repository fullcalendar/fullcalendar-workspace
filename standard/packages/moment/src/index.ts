import { createPlugin, PluginDef } from '@fullcalendar/core'
import { formatWithCmdStr } from './format'

export default createPlugin({
  name: '<%= pkgName %>',
  cmdFormatter: formatWithCmdStr,
}) as PluginDef

export { toMoment, toMomentDuration } from './convert'
