import { createPlugin } from '@fullcalendar/core/internal'
import { buildLicenseWarning } from './license.js'
import { OPTION_REFINERS } from './options-refiners.js'
import './ambient.js'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  optionRefiners: OPTION_REFINERS,
  viewContainerAppends: [buildLicenseWarning],
})
