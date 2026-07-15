import { PluginInput } from '@fullcalendar/preact/public-api'
import { buildLicenseWarning } from './license'
import { LISTENER_REFINERS, OPTION_DEFAULTS, OPTION_REFINERS } from './options'

export default {
  name: 'common',
  premiumReleaseDate: '<%= releaseDate %>',
  optionRefiners: OPTION_REFINERS,
  optionDefaults: OPTION_DEFAULTS,
  listenerRefiners: LISTENER_REFINERS,
  viewContainerAppends: [buildLicenseWarning],
} as PluginInput
