import { globalPlugins } from '@fullcalendar/core'
import plugin from './index'
import * as Internal from './internal'

globalPlugins.push(plugin)

export { plugin as default, Internal }
export * from './index'
