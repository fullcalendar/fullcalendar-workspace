import { createPlugin, PluginDef } from '@fullcalendar/preact'
import premiumCommonPlugin from '../common'
import { ScrollerSyncer } from './ScrollerSyncer'

export default createPlugin({
  name: 'scrollgrid',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [premiumCommonPlugin],
  scrollerSyncerClass: ScrollerSyncer
}) as PluginDef
