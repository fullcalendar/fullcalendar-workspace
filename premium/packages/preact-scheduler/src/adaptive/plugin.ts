import { PluginInput } from '@fullcalendar/preact/public-api'
import premiumCommonPlugin from '../premium-common/plugin'
import { contextInit } from './print-listeners'

export default {
  name: 'adaptive',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [premiumCommonPlugin],
  contextInit,
} as PluginInput
