import { createPlugin } from '@fullcalendar/core'
import { buildLicenseWarning } from './license.js'
import { OPTION_REFINERS } from './options.js'
import './options-declare.js'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  optionRefiners: OPTION_REFINERS,
  viewContainerAppends: [buildLicenseWarning],
})
