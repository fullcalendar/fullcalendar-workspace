import { createPlugin, PluginDef } from '@fullcalendar/core'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import { contextInit } from './global-handlers.js'
import './ambient.js'
import './index.css'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [premiumCommonPlugin],
  contextInit,
}) as PluginDef
