import { PluginDefInput } from '@fullcalendar/preact/public-api'
import premiumCommonPlugin from '../common/plugin'
import { contextInit } from './global-handlers'

export default {
  name: 'adaptive',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [premiumCommonPlugin],
  contextInit,
} as PluginDefInput
