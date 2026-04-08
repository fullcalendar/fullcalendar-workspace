import { PluginInput } from '@fullcalendar/preact/public-api'
import { buildLicenseWarning } from './license'
import { OPTION_REFINERS } from './options'

export default {
  name: 'common',
  premiumReleaseDate: '<%= releaseDate %>',
  optionRefiners: OPTION_REFINERS,
  viewContainerAppends: [buildLicenseWarning],
} as PluginInput
