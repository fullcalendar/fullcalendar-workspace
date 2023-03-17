import { globalPlugins } from '@fullcalendar/core'
import plugin from './index.js'
import * as Internal from './internal.js'

globalPlugins.push(plugin)

export * from './index.js'
export { plugin as default, Internal }
