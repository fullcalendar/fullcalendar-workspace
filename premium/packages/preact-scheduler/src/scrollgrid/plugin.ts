import { createPlugin, PluginDef } from '@fullcalendar/preact'
import premiumCommonPlugin from '../common'
import '../common/ambient'
import { ScrollerSyncer } from './ScrollerSyncer'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [premiumCommonPlugin],
  scrollerSyncerClass: ScrollerSyncer
}) as PluginDef
