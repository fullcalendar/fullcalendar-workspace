import { globalPlugins } from '@fullcalendar/core'
import plugin from './index'

globalPlugins.push(plugin)

export { plugin as default }
export * from './index'
