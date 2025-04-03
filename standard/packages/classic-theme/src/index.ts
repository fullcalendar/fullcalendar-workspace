import { createPlugin, PluginDef } from '@fullcalendar/core'
import './index.css'

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {}
}) as PluginDef
