import { PluginInput } from '@fullcalendar/preact/public-api'
import premiumCommonPlugin from '../premium-common/plugin'
import { ScrollerSyncer } from './ScrollerSyncer'

export default {
  name: 'scrollgrid',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [premiumCommonPlugin],
  scrollerSyncerClass: ScrollerSyncer
} as PluginInput
