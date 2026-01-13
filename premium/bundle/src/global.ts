import * as Internal from '@fullcalendar/core/internal'
import { globalPlugins } from './index.js' // HACK to ensure side-effect isn't tree-shaken

export { Internal, globalPlugins }
export * from './index.js'
