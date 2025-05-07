import * as Internal from '@fullcalendar/core/internal'
import * as Preact from '@fullcalendar/core/preact'
import { globalPlugins } from './index.js' // HACK to ensure side-effect isn't tree-shaken

export { Internal, Preact, globalPlugins }
export * from './index.js'
