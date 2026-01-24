import { PluginDefInput } from '@fullcalendar/preact/public-api'
import premiumCommonPlugin from '../common/plugin'
import { ScrollerSyncer } from './ScrollerSyncer'

export default {
  name: 'scrollgrid',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [premiumCommonPlugin],
  scrollerSyncerClass: ScrollerSyncer
} as PluginDefInput
